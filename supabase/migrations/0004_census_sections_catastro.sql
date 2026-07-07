-- VALIO 0004 — pipeline de zona real: secciones censales (PostGIS), RPC punto→sección,
-- caché del Catastro OVC y año del dato de renta en zone_stats.
-- Alineamiento obligatorio: seccionado 2023 (SECC_CE_20230101) ↔ renta ADRH 2023 (tabla 30896).
-- Los códigos de sección cambian entre años: no mezclar seccionado de otro año con renta 2023.

-- Geometrías de secciones censales INE.
-- GLOBAL: lectura para autenticados; escritura solo por service_role/ogr2ogr (sin policy de insert).
create table public.census_sections (
  cusec text primary key,
  cumun text not null,
  year int not null,
  geom geometry(multipolygon, 4326) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index census_sections_geom_idx on public.census_sections using gist (geom);
alter table public.census_sections enable row level security;
create policy "census_sections lectura autenticados" on public.census_sections
  for select to authenticated using (true);

-- Punto WGS84 (lat/lon) → CUSEC. security invoker: solo lee census_sections y la RLS aplica.
create or replace function public.census_section_for_point(
  p_lat double precision,
  p_lon double precision
)
returns text language sql stable security invoker as $$
  select cusec
  from public.census_sections
  where st_contains(geom, st_setsrid(st_makepoint(p_lon, p_lat), 4326))
  limit 1
$$;

-- Caché de consultas al Catastro OVC. Compartida entre workspaces: la referencia
-- catastral y sus datos no protegidos son públicos, no hay dato de tenant aquí.
-- insert para authenticated (los server actions corren con la sesión del usuario);
-- sin update/delete → inmutable desde el cliente (un refresco futuro iría por service_role).
create table public.catastro_cache (
  ref_cat text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.catastro_cache enable row level security;
create policy "catastro_cache lectura autenticados" on public.catastro_cache
  for select to authenticated using (true);
create policy "catastro_cache insert autenticados" on public.catastro_cache
  for insert to authenticated with check (true);

-- Año del dato de renta (2023 en la carga inicial). NULL en las filas seed del Plan 1.
alter table public.zone_stats add column income_year int;
