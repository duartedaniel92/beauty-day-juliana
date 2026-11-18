-- Contadores sem IP/contato em claro. Nenhum acesso por anon/authenticated.
create table public.rate_limit_buckets (
  scope text not null,
  identity_hash text not null check (identity_hash ~ '^[a-f0-9]{64}$'),
  hits integer not null check (hits > 0),
  expires_at timestamptz not null,
  primary key (scope, identity_hash)
);
create index rate_limit_expiration on public.rate_limit_buckets(expires_at);
alter table public.rate_limit_buckets enable row level security;
revoke all on public.rate_limit_buckets from public, anon, authenticated;
grant all on public.rate_limit_buckets to service_role;

create function public.consume_rate_limit(p_scope text, p_identity_hash text, p_limit integer, p_window_seconds integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_now timestamptz := clock_timestamp(); v_bucket public.rate_limit_buckets%rowtype;
begin
  if p_scope is null or p_scope !~ '^[a-z_]{1,40}$' or p_identity_hash is null
    or p_identity_hash !~ '^[a-f0-9]{64}$' or p_limit is null or p_limit not between 1 and 1000
    or p_window_seconds is null or p_window_seconds not between 1 and 86400 then
    raise exception using errcode='22023', message='Limite inválido.';
  end if;
  -- Limpeza limitada por chamada, com índice e SKIP LOCKED para não esperar outro visitante.
  delete from public.rate_limit_buckets where (scope,identity_hash) in (
    select scope,identity_hash from public.rate_limit_buckets where expires_at < v_now
    order by expires_at limit 100 for update skip locked
  );
  insert into public.rate_limit_buckets(scope,identity_hash,hits,expires_at)
    values(p_scope,p_identity_hash,1,v_now+make_interval(secs=>p_window_seconds))
    on conflict(scope,identity_hash) do update set
      hits=case when rate_limit_buckets.expires_at <= v_now then 1 else least(rate_limit_buckets.hits+1,p_limit+1) end,
      expires_at=case when rate_limit_buckets.expires_at <= v_now then excluded.expires_at else rate_limit_buckets.expires_at end
    returning * into v_bucket;
  return jsonb_build_object('allowed',v_bucket.hits<=p_limit,'retry_after_seconds',
    case when v_bucket.hits<=p_limit then 0 else greatest(1,ceil(extract(epoch from(v_bucket.expires_at-v_now)))::integer) end);
end $$;
revoke all on function public.consume_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text,text,integer,integer) to service_role;
