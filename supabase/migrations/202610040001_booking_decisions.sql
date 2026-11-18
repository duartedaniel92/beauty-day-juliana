-- Revisar e aplicar antes de ativar BOOKING_APPROVAL_ENABLED.
-- Reservas existentes permanecem confirmadas; nenhuma reserva é excluída.
alter table public.appointments
  add column status text not null default 'confirmed' check (status in ('pending','confirmed','cancelled','rejected','expired')),
  add column expires_at timestamptz,
  add column version integer not null default 0;
alter table public.appointments drop constraint no_overlap;
alter table public.appointments add constraint no_overlap
  exclude using gist (tstzrange(start_time,end_time) with &&)
  where (status in ('pending','confirmed'));

create table public.appointment_history (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments(id),
  actor_id uuid references auth.users(id),
  action text not null,
  old_start timestamptz not null,
  new_start timestamptz not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);
alter table public.appointment_history enable row level security;
revoke all on public.appointment_history from anon, authenticated;
grant select, insert on public.appointment_history to service_role;
grant usage, select on sequence public.appointment_history_id_seq to service_role;

-- Expiração é resolvida sob o mesmo lock de todas as mutações da agenda.
create function public.expire_booking_requests() returns void
language plpgsql security invoker set search_path='' as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(72419,1);
  with expired as (
    update public.appointments set status='expired', version=version+1
    where status='pending' and expires_at <= clock_timestamp()
    returning id,start_time
  ) insert into public.appointment_history(appointment_id,action,old_start,new_start)
    select id,'expire',start_time,start_time from expired;
end $$;
revoke all on function public.expire_booking_requests() from public,anon,authenticated;
grant execute on function public.expire_booking_requests() to service_role;

-- A inserção de bloqueios também libera pedidos vencidos antes de checar colisões.
create function public.expire_before_insert() returns trigger
language plpgsql security invoker set search_path='' as $$ begin
  perform public.expire_booking_requests();
  return null;
end $$;
create trigger expire_before_insert before insert on public.appointments
for each statement execute function public.expire_before_insert();
revoke all on function public.expire_before_insert() from public,anon,authenticated;

create function public.request_appointment(
  p_service_ids uuid[], p_start_time timestamptz, p_client_name text,
  p_client_whatsapp text, p_client_email text
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_now timestamp; v_expiry timestamptz;
begin
  perform pg_catalog.pg_advisory_xact_lock(72419,1);
  v_id := public.book_appointment(p_service_ids,p_start_time,p_client_name,p_client_whatsapp,p_client_email);
  v_now := clock_timestamp() at time zone 'America/Sao_Paulo';
  if exists(select 1 from public.business_hours where day_of_week=extract(dow from v_now)
    and is_working and v_now::time >= start_time and v_now::time < end_time) then
    v_expiry := clock_timestamp() + interval '120 minutes';
  end if;
  update public.appointments set status='pending',expires_at=v_expiry where id=v_id;
  insert into public.appointment_history(appointment_id,action,old_start,new_start)
    values(v_id,'request',p_start_time,p_start_time);
  return v_id;
end $$;
revoke all on function public.request_appointment(uuid[],timestamptz,text,text,text) from public,anon,authenticated;
grant execute on function public.request_appointment(uuid[],timestamptz,text,text,text) to service_role;

create function public.decide_appointment(p_id uuid,p_version integer,p_action text,
  p_actor uuid,p_start_time timestamptz default null,p_reason text default '')
returns void language plpgsql security invoker set search_path='' as $$
declare a public.appointments%rowtype; h public.business_hours%rowtype;
  v_end timestamptz; v_local timestamp; v_new_start timestamptz;
begin
  perform pg_catalog.pg_advisory_xact_lock(72419,1);
  if p_actor is null or not exists(select 1 from public.salon_owner where user_id=p_actor) then
    raise exception using errcode='42501',message='Acesso não autorizado.';
  end if;
  perform public.expire_booking_requests();
  select * into a from public.appointments where id=p_id and type='booking' for update;
  if not found or p_version is null or a.version <> p_version
    or a.status not in ('pending','confirmed') then
    raise exception using errcode='40001',message='Reserva alterada ou encerrada. Atualize a agenda.';
  end if;
  if p_action is null or p_action not in ('approve','reschedule','cancel','reject')
    or p_reason is null or length(p_reason)>500
    or (p_action in ('cancel','reject') and length(trim(p_reason))<3)
    or (p_action in ('approve','reject') and a.status <> 'pending') then
    raise exception using errcode='22023',message='Decisão inválida.';
  end if;
  v_new_start := a.start_time;
  if p_action='approve' and a.start_time <= clock_timestamp() then
    raise exception using errcode='22023',message='Este horário já passou.';
  end if;
  if p_action='reschedule' then
    if p_start_time is null or not isfinite(p_start_time) or p_start_time < clock_timestamp()+interval '2 hours' then
      raise exception using errcode='22023',message='O novo horário exige duas horas de antecedência.';
    end if;
    v_local := p_start_time at time zone 'America/Sao_Paulo';
    v_end := p_start_time+(a.end_time-a.start_time);
    select * into h from public.business_hours where day_of_week=extract(dow from v_local);
    if not found or not h.is_working or h.start_time is null or h.end_time is null
      or v_local::time < h.start_time or (v_end at time zone 'America/Sao_Paulo')::time > h.end_time
      or v_local::date <> (v_end at time zone 'America/Sao_Paulo')::date
      or mod(extract(epoch from(v_local::time-h.start_time))::numeric,900)<>0 then
      raise exception using errcode='22023',message='Horário fora do expediente ou da grade.';
    end if;
    v_new_start := p_start_time;
    update public.appointments set start_time=p_start_time,end_time=v_end where id=p_id;
  end if;
  update public.appointments set
    status=case p_action when 'cancel' then 'cancelled' when 'reject' then 'rejected' else 'confirmed' end,
    expires_at=null,version=version+1 where id=p_id;
  insert into public.appointment_history(appointment_id,actor_id,action,old_start,new_start,reason)
    values(p_id,p_actor,p_action,a.start_time,v_new_start,trim(p_reason));
end $$;
revoke all on function public.decide_appointment(uuid,integer,text,uuid,timestamptz,text) from public,anon,authenticated;
grant execute on function public.decide_appointment(uuid,integer,text,uuid,timestamptz,text) to service_role;

-- Cancelamentos/recusas não impedem mudar o expediente; pedidos ainda ativos impedem.
create or replace function private.protect_future_bookings() returns trigger
language plpgsql security definer set search_path='' as $$ begin
  if exists(select 1 from public.appointments a
    left join public.business_hours h on h.day_of_week=extract(dow from a.start_time at time zone 'America/Sao_Paulo')
    where a.type='booking' and a.status in ('pending','confirmed') and a.end_time>now()
      and (a.status<>'pending' or a.expires_at is null or a.expires_at>clock_timestamp()) and (
      h.day_of_week is null or not h.is_working or h.start_time is null or h.end_time is null
      or (a.start_time at time zone 'America/Sao_Paulo')::date<>(a.end_time at time zone 'America/Sao_Paulo')::date
      or (a.start_time at time zone 'America/Sao_Paulo')::time<h.start_time
      or (a.end_time at time zone 'America/Sao_Paulo')::time>h.end_time)) then
    raise exception using errcode='23514',message='Há reservas futuras fora do novo expediente.';
  end if;
  return null;
end $$;
