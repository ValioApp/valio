-- VALIO 0005 — fotos del inmueble (property_photos) + RLS de Storage por workspace.
-- Los inversores/agencias suben fotos DESPUÉS de valorar (fotografían en la visita);
-- se asocian a la property que la valoración ya crea. Banda visual del informe.
-- El bucket 'property-photos' (privado, 6 MB, jpeg/png/webp) YA existe: aquí solo RLS.
-- Ruta canónica de los objetos: <workspace_id>/<property_id>/<uuid>.<ext>.

create table if not exists public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  storage_path text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_photos_property_idx
  on public.property_photos (property_id, sort_order);

alter table public.property_photos enable row level security;

drop policy if exists "property_photos del workspace" on public.property_photos;
create policy "property_photos del workspace" on public.property_photos
  for all to authenticated
  using (workspace_id = public.auth_workspace_id())
  with check (workspace_id = public.auth_workspace_id());

-- Storage RLS sobre storage.objects para el bucket 'property-photos'.
-- storage.foldername(name) devuelve text[] con las carpetas de la ruta; el índice 1
-- (arrays 1-based en Postgres) es la primera carpeta = <workspace_id>. Así el usuario
-- solo lee/sube/borra dentro de la carpeta de SU workspace.
drop policy if exists "property_photos storage select" on storage.objects;
create policy "property_photos storage select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = public.auth_workspace_id()::text
  );

drop policy if exists "property_photos storage insert" on storage.objects;
create policy "property_photos storage insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = public.auth_workspace_id()::text
  );

drop policy if exists "property_photos storage delete" on storage.objects;
create policy "property_photos storage delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = public.auth_workspace_id()::text
  );
