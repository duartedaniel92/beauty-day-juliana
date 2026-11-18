-- Chaves de reenvio vinculadas ao navegador por HMAC no servidor, sem dados de contato.
create table public.booking_submissions (
  request_key text primary key check (request_key ~ '^[a-f0-9]{64}$'),
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.booking_submissions enable row level security;
revoke all on public.booking_submissions from public, anon, authenticated;
grant all on public.booking_submissions to service_role;

create function public.submit_appointment(
  p_request_key text, p_fingerprint text, p_service_ids uuid[], p_start_time timestamptz,
  p_client_name text, p_client_whatsapp text, p_client_email text, p_expected_services jsonb, p_pending boolean
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_previous public.booking_submissions%rowtype; v_quote jsonb; v_id uuid;
begin
  -- Mesma ordem de lock do catálogo/expediente/reservas; preço não muda entre comparação e gravação.
  perform pg_catalog.pg_advisory_xact_lock(72419,1);
  if p_request_key is null or p_request_key !~ '^[a-f0-9]{64}$' or p_fingerprint is null
    or p_fingerprint !~ '^[a-f0-9]{64}$' or p_pending is null then
    raise exception using errcode='22023',message='Pedido inválido.';
  end if;
  select * into v_previous from public.booking_submissions where request_key=p_request_key;
  if found then
    if v_previous.fingerprint<>p_fingerprint or v_previous.created_at < clock_timestamp()-interval '24 hours' then
      raise exception using errcode='22023',message='Pedido inválido.';
    end if;
    return v_previous.appointment_id;
  end if;
  select jsonb_agg(jsonb_build_object('id',id::text,'priceCents',price_cents,'durationMinutes',duration_minutes) order by id)
    into v_quote from public.services where active and id=any(p_service_ids);
  if v_quote is null or p_expected_services is null or v_quote<>p_expected_services then
    raise exception using errcode='BD001',message='Serviços alterados; reconfirme a seleção.';
  end if;
  if p_pending then
    v_id:=public.request_appointment(p_service_ids,p_start_time,p_client_name,p_client_whatsapp,p_client_email);
  else
    v_id:=public.book_appointment(p_service_ids,p_start_time,p_client_name,p_client_whatsapp,p_client_email);
  end if;
  insert into public.booking_submissions(request_key,fingerprint,appointment_id) values(p_request_key,p_fingerprint,v_id);
  return v_id;
end $$;
revoke all on function public.submit_appointment(text,text,uuid[],timestamptz,text,text,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.submit_appointment(text,text,uuid[],timestamptz,text,text,text,jsonb,boolean) to service_role;
