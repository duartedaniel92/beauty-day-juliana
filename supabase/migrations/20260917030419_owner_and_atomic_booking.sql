-- Uma única proprietária. A conta já provisionada é vinculada apenas se for inequívoca.
create table public.salon_owner (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete restrict
);
alter table public.salon_owner enable row level security;
revoke all on public.salon_owner from anon, authenticated;
grant select on public.salon_owner to authenticated;
grant all on public.salon_owner to service_role;
create policy "owner reads own membership" on public.salon_owner for select to authenticated
  using (user_id = (select auth.uid()));
do $$ begin
  if (select count(*) from auth.users) = 1 then
    insert into public.salon_owner(user_id) select id from auth.users;
  else
    raise exception 'Defina explicitamente a proprietária: esperado exatamente um usuário provisionado.';
  end if;
end $$;

drop policy "services are writable by authenticated users" on public.services;
drop policy "business_hours are writable by authenticated users" on public.business_hours;
create policy "owner manages services" on public.services for all to authenticated
  using (exists (select 1 from public.salon_owner where user_id = (select auth.uid())))
  with check (exists (select 1 from public.salon_owner where user_id = (select auth.uid())));
create policy "authenticated reads active services" on public.services for select to authenticated using (active);
create policy "owner updates hours" on public.business_hours for update to authenticated
  using (exists (select 1 from public.salon_owner where user_id = (select auth.uid())))
  with check (exists (select 1 from public.salon_owner where user_id = (select auth.uid())));
grant select on public.services, public.business_hours to anon, authenticated;
grant insert, update, delete on public.services to authenticated;
grant update on public.business_hours to authenticated;
grant all on public.services, public.business_hours, public.appointments, public.appointment_services to service_role;

-- Lock por salão (há apenas um): adquirido ANTES dos row locks, inclusive na Data API.
-- Garante ordem única entre reserva, bloqueio, catálogo e expediente.
create function public.lock_salon_schedule() returns trigger language plpgsql
  set search_path = '' as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(72419, 1);
  return null;
end $$;
create trigger serialize_services before insert or update or delete on public.services
  for each statement execute function public.lock_salon_schedule();
create trigger serialize_hours before insert or update or delete on public.business_hours
  for each statement execute function public.lock_salon_schedule();
create trigger serialize_appointments before insert or update or delete on public.appointments
  for each statement execute function public.lock_salon_schedule();
revoke all on function public.lock_salon_schedule() from public, anon, authenticated;

-- Restrinja alteração do expediente que invalidaria reservas já confirmadas.
-- SECURITY DEFINER é necessário só para esta trigger ler appointments sob RLS.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create function private.protect_future_bookings() returns trigger language plpgsql security definer
  set search_path = '' as $$ begin
  if exists (
    select 1 from public.appointments a
    left join public.business_hours h on h.day_of_week = extract(dow from a.start_time at time zone 'America/Sao_Paulo')
    where a.type = 'booking' and a.end_time > now() and (
      h.day_of_week is null or not h.is_working or h.start_time is null or h.end_time is null
      or (a.start_time at time zone 'America/Sao_Paulo')::date <> (a.end_time at time zone 'America/Sao_Paulo')::date
      or (a.start_time at time zone 'America/Sao_Paulo')::time < h.start_time
      or (a.end_time at time zone 'America/Sao_Paulo')::time > h.end_time
    )
  ) then raise exception using errcode='23514', message='Há agendamentos futuros fora do novo expediente.'; end if;
  return null;
end $$;
revoke all on function private.protect_future_bookings() from public, anon, authenticated;
create trigger protect_future_bookings after update or delete on public.business_hours
  for each statement execute function private.protect_future_bookings();

create function public.book_appointment(
  p_service_ids uuid[], p_start_time timestamptz, p_client_name text,
  p_client_whatsapp text, p_client_email text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_duration integer;
  v_count integer;
  v_end timestamptz;
  v_local timestamp;
  v_hours public.business_hours%rowtype;
  v_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(72419, 1);
  if p_start_time is null or not isfinite(p_start_time) or p_start_time < clock_timestamp() + interval '2 hours'
    or coalesce(cardinality(p_service_ids),0) not between 1 and 20
    or (select count(distinct id) from unnest(p_service_ids) id) <> cardinality(p_service_ids)
    or p_client_name is null or length(trim(p_client_name)) not between 2 and 120
    or p_client_whatsapp is null or p_client_whatsapp !~ '^[0-9]{10,11}$'
    or p_client_email is null or length(p_client_email) > 254 or p_client_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then raise exception using errcode='22023', message='Dados de agendamento inválidos.'; end if;

  select count(*), sum(duration_minutes) into v_count, v_duration
    from public.services where id = any(p_service_ids) and active;
  if v_count <> cardinality(p_service_ids) then
    raise exception using errcode='22023', message='Serviço indisponível.';
  end if;
  v_local := p_start_time at time zone 'America/Sao_Paulo';
  v_end := p_start_time + make_interval(mins => v_duration);
  select * into v_hours from public.business_hours where day_of_week=extract(dow from v_local);
  if not found or not v_hours.is_working or v_hours.start_time is null or v_hours.end_time is null
    or v_local::time < v_hours.start_time
    or (v_end at time zone 'America/Sao_Paulo')::date <> v_local::date
    or (v_end at time zone 'America/Sao_Paulo')::time > v_hours.end_time
    or mod(extract(epoch from (v_local::time - v_hours.start_time))::numeric, 900) <> 0
  then raise exception using errcode='22023', message='Horário fora do expediente ou da grade de atendimento.'; end if;

  insert into public.appointments(type,client_name,client_whatsapp,client_email,start_time,end_time)
    values ('booking',trim(p_client_name),p_client_whatsapp,trim(p_client_email),p_start_time,v_end) returning id into v_id;
  insert into public.appointment_services(appointment_id,service_id,service_name_snapshot,price_cents_snapshot,duration_minutes_snapshot)
    select v_id,id,name,price_cents,duration_minutes from public.services where id=any(p_service_ids);
  return v_id;
end $$;
revoke all on function public.book_appointment(uuid[],timestamptz,text,text,text) from public, anon, authenticated;
grant execute on function public.book_appointment(uuid[],timestamptz,text,text,text) to service_role;

create function public.save_business_hours(p_days jsonb) returns void
  language plpgsql security invoker set search_path = '' as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(72419, 1);
  if jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) <> 7 then
    raise exception using errcode='22023', message='Informe os sete dias.';
  end if;
  if (select count(distinct x.day_of_week) from jsonb_to_recordset(p_days) as x(day_of_week integer)) <> 7
    or exists (select 1 from jsonb_to_recordset(p_days) as x(day_of_week integer, is_working boolean, start_time time, end_time time)
      where x.day_of_week is null or x.day_of_week not between 0 and 6 or x.is_working is null
        or (x.is_working and (x.start_time is null or x.end_time is null or x.end_time <= x.start_time))) then
    raise exception using errcode='22023', message='Expediente inválido.';
  end if;
  update public.business_hours h set is_working=x.is_working,
    start_time=case when x.is_working then x.start_time else null end,
    end_time=case when x.is_working then x.end_time else null end
    from jsonb_to_recordset(p_days) as x(day_of_week integer, is_working boolean, start_time time, end_time time)
    where h.day_of_week=x.day_of_week;
end $$;
revoke all on function public.save_business_hours(jsonb) from public, anon, authenticated;
grant execute on function public.save_business_hours(jsonb) to service_role;
