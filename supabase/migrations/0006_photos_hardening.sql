-- VALIO 0006 — endurecimiento de las fotos del inmueble (defensa en profundidad).
-- Post-revisión adversarial del carrusel (2026-07-08). No hay datos que migrar.
--
-- 1) Versiona el bucket 'property-photos' como infra-as-code (idempotente): antes solo
--    existía creado a mano en el dashboard. Queda privado, ≤6 MB, jpeg/png/webp.
-- 2) Reendurece las policies de public.property_photos: además de atar la fila al
--    workspace, el INSERT exige que storage_path viva bajo la carpeta del workspace
--    (<workspace_id>/...), cerrando el hueco de registrar una fila de metadatos que
--    apunte a un objeto de otro tenant. La RLS de storage.objects (0005) ya lo cubre
--    en Storage; esto lo replica en la tabla de metadatos (defensa en profundidad).
--    La ALL de 0005 se sustituye por policies por-comando para poder afinar el INSERT.

-- 1) Bucket como código ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-photos', 'property-photos', false, 6291456, '{image/jpeg,image/png,image/webp}')
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Policies de property_photos por comando (sustituyen la ALL de 0005) ------------
drop policy if exists "property_photos del workspace" on public.property_photos;

drop policy if exists "property_photos select" on public.property_photos;
create policy "property_photos select" on public.property_photos
  for select to authenticated
  using (workspace_id = public.auth_workspace_id());

-- El INSERT ata storage_path a la carpeta del workspace: <workspace_id>/...
drop policy if exists "property_photos insert" on public.property_photos;
create policy "property_photos insert" on public.property_photos
  for insert to authenticated
  with check (
    workspace_id = public.auth_workspace_id()
    and storage_path like public.auth_workspace_id()::text || '/%'
  );

-- UPDATE con with_check para impedir mover una fila a otro workspace (reordenar, etc.).
drop policy if exists "property_photos update" on public.property_photos;
create policy "property_photos update" on public.property_photos
  for update to authenticated
  using (workspace_id = public.auth_workspace_id())
  with check (workspace_id = public.auth_workspace_id());

drop policy if exists "property_photos delete" on public.property_photos;
create policy "property_photos delete" on public.property_photos
  for delete to authenticated
  using (workspace_id = public.auth_workspace_id());
