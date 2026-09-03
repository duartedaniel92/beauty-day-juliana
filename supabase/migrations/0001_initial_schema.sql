-- supabase/migrations/0001_initial_schema.sql

create extension if not exists btree_gist;

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null check (price_cents > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table business_hours (
  day_of_week smallint primary key check (day_of_week between 0 and 6),
  start_time time,
  end_time time,
  is_working boolean not null default true,
  constraint working_day_has_hours
    check (not is_working or (start_time is not null and end_time is not null and end_time > start_time))
);

-- 0=domingo, 1=segunda: fechado. 2=terca a 6=sabado: 09h-18h.
-- Editavel depois pelo painel de configuracoes (Plano 3).
insert into business_hours (day_of_week, start_time, end_time, is_working) values
  (0, null, null, false),
  (1, null, null, false),
  (2, '09:00', '18:00', true),
  (3, '09:00', '18:00', true),
  (4, '09:00', '18:00', true),
  (5, '09:00', '18:00', true),
  (6, '09:00', '18:00', true);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('booking', 'block')),
  client_name text,
  client_whatsapp text,
  client_email text,
  start_time timestamptz not null,
  end_time timestamptz not null check (end_time > start_time),
  notes text,
  created_at timestamptz not null default now(),
  constraint client_data_required_for_booking
    check (
      type = 'block'
      or (client_name is not null and client_whatsapp is not null and client_email is not null)
    ),
  constraint no_overlap
    exclude using gist (tstzrange(start_time, end_time) with &&)
);

create table appointment_services (
  appointment_id uuid not null references appointments(id) on delete cascade,
  service_id uuid not null references services(id),
  service_name_snapshot text not null,
  price_cents_snapshot integer not null,
  duration_minutes_snapshot integer not null,
  primary key (appointment_id, service_id)
);

alter table services enable row level security;
alter table business_hours enable row level security;
alter table appointments enable row level security;
alter table appointment_services enable row level security;

create policy "active services are publicly readable"
  on services for select
  to anon
  using (active);

create policy "services are writable by authenticated users"
  on services for all
  to authenticated
  using (true)
  with check (true);

create policy "business_hours are publicly readable"
  on business_hours for select
  to anon, authenticated
  using (true);

create policy "business_hours are writable by authenticated users"
  on business_hours for update
  to authenticated
  using (true)
  with check (true);

-- appointments e appointment_services: nenhuma policy, pra nenhum papel.
-- RLS habilitada aqui e so como defesa em profundidade: por desenho, todo
-- acesso a estas duas tabelas (leitura publica de horarios ocupados, criacao
-- de agendamento, bloqueio manual pela profissional) passa exclusivamente
-- pela service role key dentro de Server Actions (Plano 2) -- inclusive as
-- acoes do painel admin. Nenhum papel do Postgres (anon nem authenticated)
-- tem acesso direto a estas duas tabelas.
