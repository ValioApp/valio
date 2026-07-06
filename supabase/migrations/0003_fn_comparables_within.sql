-- VALIO 0003 — candidatos por radio con distancia (RLS aplica: security invoker)
create or replace function public.comparables_within(
  p_lat double precision,
  p_lon double precision,
  p_radius_m double precision default 1500,
  p_kind text default 'piso'
)
returns table (
  id uuid, kind text, price numeric, is_closing_price boolean,
  built_area_m2 numeric, bedrooms int, floor int, has_elevator boolean,
  year_built int, condition text, occupancy text,
  lat double precision, lon double precision, census_section_id text,
  observed_at date, source text, distance_m double precision
)
language sql stable security invoker as $$
  select c.id, c.kind, c.price, c.is_closing_price,
         c.built_area_m2, c.bedrooms, c.floor, c.has_elevator,
         c.year_built, c.condition, c.occupancy,
         c.lat, c.lon, c.census_section_id,
         c.observed_at, c.source,
         st_distance(c.geom, st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography) as distance_m
  from public.comparables c
  where c.kind = p_kind
    and st_dwithin(c.geom, st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography, p_radius_m)
  order by distance_m
  limit 200
$$;
