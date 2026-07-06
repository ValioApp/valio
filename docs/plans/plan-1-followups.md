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

## Pendientes de la revisión de la capa app (2026-07-07)

6. **`proxy.ts` (middleware de Next 16) inexistente**: hoy todo el código con sesión
   corre en server actions/route handlers, pero un Server Component futuro con
   Supabase no refrescará sesiones expiradas. Añadir antes de producción real.
7. Persistencia no atómica (property sin valuation si falla el 2º insert) →
   mover a RPC/transacción en Plan 2. (El logging ya se añadió 2026-07-07.)
8. Mensajes de error Zod en inglés y sin nombre de campo → mensajes custom es-ES.
9. `e.message` de Supabase llega al usuario (nombres de RPC/tabla) → sanitizar en
   Plan 3 antes de exponer públicamente.
10. `lat: min(35)` excluye Canarias (~27.6-29.5) → ampliar al expandir cobertura.
11. `yearBuilt: max(2026)` hardcodeado → usar año actual.
12. `fetchZoneStats` carga la tabla entera — OK con seeds, inviable con ~36k
    secciones censales → fetch por secciones implicadas en Plan 2.

## Pendientes de la revisión de la integración de diseño (2026-07-07)

13. `login/page.tsx`: éxito detectado por prefijo del copy (`startsWith('Revisa tu correo')`)
    — frágil; migrar el action a estado discriminado `{status}` cuando se pueda tocar.
14. `lib/valuations.ts`: doble cast sin tipos generados de Supabase → generar tipos
    `Database` (supabase gen types) en Plan 2.
15. Piezas de diseño diferidas a propósito: buscador dirección+mapa+Catastro (Plan 2),
    botones "Descargar PDF"/"Guardar en cartera" (Plan 3), item "Más" del bottom-nav.
16. `cartera/page.tsx`: `<th>` sin `scope="col"` (accesibilidad, cosmético).

## Gaps de cobertura de tests (añadir en Plan 2)

- Ajuste `estado` (condition) sin ningún test directo, incluido default `null → buen_estado`.
- Boundary exacto de 6 testigos (rechaza 5, acepta 6).
- Confianza `media` nunca asertada explícitamente.
- El test "vale MÁS si testigos de zona rica" en realidad solo ejercita
  `negotiationDiscount` — renombrar o añadir caso cross-zona real en valuate.
- `occupancy: 'alquilado'`, `yearBuilt: null`, `floor: null` sin cobertura.
