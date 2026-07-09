-- VALIO 0007 — sección "Inmuebles ocupados" (cartera del socio, Aliseda).
-- Catálogo GLOBAL de referencia (no multi-tenant): lo consultan todos los usuarios
-- de VALIO en la sección de ocupados. Escritura solo por service_role (importador);
-- lectura para autenticados. Es la primera de varias secciones (alquiler, compra… luego).

create table public.occupied_properties (
  id text primary key,                       -- id Aliseda, p.ej. CA-000-036-708-977
  tipo_venta text not null,                  -- Ex-deudores / Okupado / Ex-inquilinos
  ccaa text not null,
  provincia text not null,
  municipio text not null,
  direccion text not null,
  cp text not null,                          -- 5 dígitos (con ceros)
  ref_catastral text,                        -- 20 chars válidos, o null
  finca_registral text,
  dormitorios int,
  banos int,
  superficie_m2 numeric,
  pvp numeric,                               -- precio de venta (descontado por ocupación)
  eur_m2 numeric,                            -- pvp / superficie, precalculado
  ocupacion_fase_raw text,                   -- estado literal del procedimiento
  ocupacion_etapa text,                      -- macro-etapa: demanda/sentencia_vista/lanzamiento/
                                             -- adjudicacion_posesion/tramite_previo/suspendido_archivo/otros/sin_dato
  link text not null,                        -- ficha en alisedainmobiliaria.com
  lat double precision,                      -- geocodificación (enriquecimiento posterior)
  lon double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index occupied_ccaa_idx on public.occupied_properties (ccaa);
create index occupied_provincia_idx on public.occupied_properties (provincia);
create index occupied_municipio_idx on public.occupied_properties (municipio);
create index occupied_etapa_idx on public.occupied_properties (ocupacion_etapa);
create index occupied_tipo_idx on public.occupied_properties (tipo_venta);

alter table public.occupied_properties enable row level security;
create policy "occupied_properties lectura autenticados" on public.occupied_properties
  for select to authenticated using (true);
