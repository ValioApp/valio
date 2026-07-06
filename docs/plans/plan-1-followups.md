# Plan 1 — Follow-ups de la revisión del motor (2026-07-07)

Salidos de la revisión consolidada (APPROVED). No bloquean el v0; se abordan en
Plan 2 (capa de ingesta) salvo indicación.

## Aplicados ya (2026-07-07)

- ✅ `valuate.ts`: filtrar comps sin `zone_stats` ANTES del corte top-20.
- ✅ `synthesize.ts`: `low` clampado a ≥ 0 (dispersión extrema fsd > 1).

## Pendientes (Plan 2 — frontera del motor / capa de datos)

1. **Validación Zod en la frontera del motor**: el motor asume inputs sanos
   (builtAreaM2 > 0, distanceM ≥ 0, fechas válidas). La capa de ingesta debe
   garantizarlo; añadir schema Zod al construir `Comparable`/`SubjectProperty`.
2. `monthsBetween` usa `Math.abs`: acepta `observedAt` futuros y silencia fechas
   malformadas (NaN) — la ingesta debe rechazarlas/reportarlas.
3. `hasElevator: null` se modela como "sin ascensor" → testigo de planta alta con
   dato desconocido infla su precio homogeneizado. Revisar en calibración.
4. `zoneAdjustmentPct` es media NO ponderada y solo de comps cross-zona; con 1 comp
   de otra zona domina la cifra mostrada. Considerar media ponderada por weight.
5. `weightedMedian` (export público) crashea con array vacío; añadir guard o
   hacerla privada.

## Gaps de cobertura de tests (añadir en Plan 2)

- Ajuste `estado` (condition) sin ningún test directo, incluido default `null → buen_estado`.
- Boundary exacto de 6 testigos (rechaza 5, acepta 6).
- Confianza `media` nunca asertada explícitamente.
- El test "vale MÁS si testigos de zona rica" en realidad solo ejercita
  `negotiationDiscount` — renombrar o añadir caso cross-zona real en valuate.
- `occupancy: 'alquilado'`, `yearBuilt: null`, `floor: null` sin cobertura.
