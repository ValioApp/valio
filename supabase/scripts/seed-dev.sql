-- VALIO seed de desarrollo — datos SINTÉTICOS (source='seed'). Purgar con:
--   delete from public.comparables where source = 'seed';
--   delete from public.zone_stats where census_section_id like 'SEED-%';

insert into public.zone_stats
  (census_section_id, municipality_code, net_income_per_capita, municipality_income_per_capita, income_coef, negotiation_discount)
values
  ('SEED-RAVAL',   '08019', 9800,  16000, 0.6125, 0.08),
  ('SEED-SARRIA',  '08019', 26500, 16000, 1.6563, 0.03),
  ('SEED-CORNELLA','08073', 12400, 12900, 0.9612, 0.06)
on conflict (census_section_id) do nothing;

-- Testigos globales (workspace_id NULL). €/m² aprox: Raval ~3.4-4.2k, Sarrià ~5.8-7k, Cornellà ~2.6-3.2k
insert into public.comparables
  (kind, price, is_closing_price, built_area_m2, bedrooms, floor, has_elevator, year_built, condition, occupancy, lat, lon, census_section_id, observed_at, source)
values
  -- Raval (8 testigos alrededor de 41.3797, 2.1682)
  ('piso', 285000, false, 70, 2, 1, false, 1930, 'buen_estado', 'libre',    41.3801, 2.1675, 'SEED-RAVAL', '2026-05-20', 'seed'),
  ('piso', 310000, false, 78, 3, 3, false, 1925, 'reformado',   'libre',    41.3792, 2.1690, 'SEED-RAVAL', '2026-06-02', 'seed'),
  ('piso', 236000, true,  65, 2, 2, false, 1940, 'buen_estado', 'libre',    41.3805, 2.1665, 'SEED-RAVAL', '2026-04-11', 'seed'),
  ('piso', 355000, false, 90, 3, 4, true,  1960, 'buen_estado', 'libre',    41.3788, 2.1702, 'SEED-RAVAL', '2026-06-15', 'seed'),
  ('piso', 198000, true,  60, 2, 1, false, 1935, 'a_reformar',  'libre',    41.3810, 2.1658, 'SEED-RAVAL', '2026-03-28', 'seed'),
  ('piso', 262000, false, 72, 3, 2, false, 1930, 'buen_estado', 'alquilado',41.3795, 2.1671, 'SEED-RAVAL', '2026-05-05', 'seed'),
  ('piso', 340000, false, 85, 3, 5, true,  1970, 'reformado',   'libre',    41.3785, 2.1695, 'SEED-RAVAL', '2026-06-20', 'seed'),
  ('piso', 176000, true,  68, 2, 3, false, 1928, 'buen_estado', 'ocupado',  41.3808, 2.1680, 'SEED-RAVAL', '2026-02-14', 'seed'),
  -- Sarrià (8 testigos alrededor de 41.3990, 2.1210)
  ('piso', 620000, false, 95,  3, 2, true, 1975, 'buen_estado', 'libre', 41.3995, 2.1205, 'SEED-SARRIA', '2026-05-18', 'seed'),
  ('piso', 590000, true,  90,  3, 1, true, 1980, 'buen_estado', 'libre', 41.3985, 2.1218, 'SEED-SARRIA', '2026-04-22', 'seed'),
  ('piso', 710000, false, 110, 4, 4, true, 1985, 'reformado',   'libre', 41.4001, 2.1198, 'SEED-SARRIA', '2026-06-08', 'seed'),
  ('piso', 545000, false, 85,  3, 3, true, 1970, 'buen_estado', 'libre', 41.3992, 2.1225, 'SEED-SARRIA', '2026-06-01', 'seed'),
  ('piso', 660000, true,  100, 3, 2, true, 1978, 'reformado',   'libre', 41.3988, 2.1202, 'SEED-SARRIA', '2026-03-15', 'seed'),
  ('piso', 780000, false, 120, 4, 5, true, 1990, 'buen_estado', 'libre', 41.4005, 2.1215, 'SEED-SARRIA', '2026-05-30', 'seed'),
  ('piso', 512000, false, 82,  2, 1, true, 1972, 'buen_estado', 'libre', 41.3998, 2.1230, 'SEED-SARRIA', '2026-06-25', 'seed'),
  ('piso', 598000, false, 92,  3, 3, true, 1976, 'buen_estado', 'libre', 41.3982, 2.1208, 'SEED-SARRIA', '2026-04-05', 'seed'),
  -- Cornellà (8 testigos alrededor de 41.3560, 2.0750)
  ('piso', 215000, false, 75, 3, 2, true,  1975, 'buen_estado', 'libre', 41.3565, 2.0745, 'SEED-CORNELLA', '2026-05-12', 'seed'),
  ('piso', 189000, true,  68, 2, 1, false, 1970, 'buen_estado', 'libre', 41.3555, 2.0758, 'SEED-CORNELLA', '2026-04-18', 'seed'),
  ('piso', 242000, false, 85, 3, 4, true,  1980, 'reformado',   'libre', 41.3570, 2.0740, 'SEED-CORNELLA', '2026-06-10', 'seed'),
  ('piso', 165000, true,  62, 2, 3, false, 1965, 'a_reformar',  'libre', 41.3550, 2.0762, 'SEED-CORNELLA', '2026-03-20', 'seed'),
  ('piso', 228000, false, 80, 3, 2, true,  1978, 'buen_estado', 'libre', 41.3562, 2.0752, 'SEED-CORNELLA', '2026-06-18', 'seed'),
  ('piso', 205000, false, 72, 3, 1, true,  1972, 'buen_estado', 'libre', 41.3558, 2.0748, 'SEED-CORNELLA', '2026-05-25', 'seed'),
  ('piso', 178000, true,  70, 2, 2, false, 1968, 'buen_estado', 'alquilado', 41.3568, 2.0755, 'SEED-CORNELLA', '2026-02-28', 'seed'),
  ('piso', 250000, false, 88, 3, 5, true,  1982, 'reformado',   'libre', 41.3553, 2.0742, 'SEED-CORNELLA', '2026-06-22', 'seed');
