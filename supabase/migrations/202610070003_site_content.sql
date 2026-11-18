-- Conteúdo publicado é público. Escrita somente pelo servidor após requireOwner.
create table public.site_content (
  singleton boolean primary key default true check (singleton),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 20000),
  version integer not null default 0 check (version >= 0)
);
insert into public.site_content (singleton) values (true);
create table public.service_media (
  service_id uuid primary key references public.services(id) on delete cascade,
  path text not null check (path ~ '^site/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$'),
  alt text not null check (length(alt) between 1 and 180)
);
alter table public.site_content enable row level security;
alter table public.service_media enable row level security;
revoke all on public.site_content, public.service_media from anon, authenticated;
grant select on public.site_content, public.service_media to anon, authenticated;
grant all on public.site_content, public.service_media to service_role;
create policy published_content on public.site_content for select to anon, authenticated using (true);
create policy active_service_photos on public.service_media for select to anon, authenticated
using (exists (select 1 from public.services s where s.id = service_id and s.active));
-- Não há política de upload para authenticated: impede contornar validação/Sharp.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('beauty-site', 'beauty-site', true, 5242880, array['image/webp']);
