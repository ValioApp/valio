-- VALIO 0002 — comparables, zone_stats, properties, valuations, imports, data_sources

-- Features de zona por sección censal (GLOBAL: lectura para autenticados, escritura service_role)
create table public.zone_stats (
  census_section_id text primary key,
  municipality_code text not null,
  net_income_per_capita numeric not null,
  municipality_income_per_capita numeric not null,
  income_coef numeric not null,
  negotiation_discount numeric not null default 0.06,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.zone_stats enable row level security;
create policy "zone_stats lectura autenticados" on public.zone_stats
  for select to authenticated using (true);

-- Testigos comparables. workspace_id NULL = global (open data); con valor = privado del workspace
create table public.comparables (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  kind text not null check (kind in ('piso','casa')),
  price numeric not null check (price > 0),
  is_closing_price boolean not null default false,
  built_area_m2 numeric not null check (built_area_m2 > 0),
  bedrooms int,
  floor int,
  has_elevator boolean,
  year_built int,
  condition text check (condition in ('a_reformar','buen_estado','reformado','obra_nueva')),
  occupancy text not null default 'libre' check (occupancy in ('libre','alquilado','ocupado')),
  lat double precision not null,
  lon double precision not null,
  census_section_id text not null references public.zone_stats(census_section_id),
  geom geography(point, 4326) generated always as (st_setsrid(st_makepoint(lon, lat), 4326)::geography) stored,
  observed_at date not null,
  source text not null,
  import_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comparables_geom_idx on public.comparables using gist (geom);
create index comparables_section_idx on public.comparables (census_section_id);
alter table public.comparables enable row level security;
create policy "comparables globales o propios" on public.comparables
  for select to authenticated
  using (workspace_id is null or workspace_id = public.auth_workspace_id());
create policy "comparables insert propio" on public.comparables
  for insert to authenticated
  with check (workspace_id = public.auth_workspace_id());

-- Inmuebles del workspace
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null check (kind in ('piso','casa')),
  address text not null,
  built_area_m2 numeric not null,
  bedrooms int not null,
  floor int,
  has_elevator boolean,
  year_built int,
  condition text not null default 'buen_estado',
  occupancy text not null default 'libre',
  lat double precision not null,
  lon double precision not null,
  census_section_id text not null references public.zone_stats(census_section_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.properties enable row level security;
create policy "properties del workspace" on public.properties
  for all to authenticated
  using (workspace_id = public.auth_workspace_id())
  with check (workspace_id = public.auth_workspace_id());

-- Valoraciones versionadas (snapshot reproducible del resultado en JSONB)
create table public.valuations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  outcome jsonb not null,
  engine_version text not null default 'v0-comparables',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.valuations enable row level security;
create policy "valuations del workspace" on public.valuations
  for all to authenticated
  using (workspace_id = public.auth_workspace_id())
  with check (workspace_id = public.auth_workspace_id());

-- Trazabilidad de importaciones (CSV del socio — Plan 2 lo usa)
create table public.imports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  filename text not null,
  row_count int not null default 0,
  status text not null default 'pending' check (status in ('pending','done','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.imports enable row level security;
create policy "imports del workspace" on public.imports
  for all to authenticated
  using (workspace_id = public.auth_workspace_id())
  with check (workspace_id = public.auth_workspace_id());

-- Registro de adapters de datos (credenciales NUNCA aquí: van en vault/env)
create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  adapter text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.data_sources enable row level security;
create policy "data_sources del workspace" on public.data_sources
  for all to authenticated
  using (workspace_id = public.auth_workspace_id())
  with check (workspace_id = public.auth_workspace_id());
