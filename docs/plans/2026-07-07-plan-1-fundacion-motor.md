# VALIO Plan 1 — Fundación + Motor de Valoración

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App Next.js 16 con esquema Supabase/PostGIS y un motor de valoración por comparables ajustados (factor zona + ocupación) que valora un piso de Barcelona con datos seed, devolviendo valor + horquilla + confianza + testigos.

**Architecture:** Motor de valoración como módulo TypeScript de **funciones puras** (testeable sin DB) en `app/src/engine/`; datos en Supabase con PostGIS (búsqueda por radio vía RPC); UI mínima con server action. Multi-tenant por `workspace_id` con RLS desde la primera migración.

**Tech Stack:** Next.js 16 (App Router) · TypeScript estricto · Tailwind · Supabase (@supabase/ssr) · PostGIS · Zod · Vitest.

**Spec:** `docs/2026-07-06-valio-design.md`. Reglas de oro en el `CLAUDE.md` del mundo (no scraping, nunca "tasación", <6 testigos = rehusar).

**Convenciones:** commits conventional-commits en español; identidad git Sekees; código/variables en inglés, textos de UI en español.

---

### Task 1: Repo git propio de VALIO + higiene del paraguas

El mundo pasa a tener repo propio (patrón OFISAT: repo en la raíz del mundo con `app/` y `supabase/` dentro). El paraguas `Sekees/universo` deja de trackear la carpeta.

**Files:**
- Create: `f:/UNIVERSO/SaaS-Empresas/VALIO/.gitignore`
- Modify: `f:/UNIVERSO/.gitignore` (paraguas)
- Modify: `f:/UNIVERSO/MANIFIESTO-REPOS.md`

- [ ] **Step 1: Crear `.gitignore` del mundo**

```gitignore
# deps y builds
node_modules/
.next/
dist/
coverage/

# secretos — NUNCA commitear
.env
.env.local
.env*.local

# datos fuente (personales / licencias) — solo docs/README dentro de data/
data/*
!data/README.md

# SO / editor
._*
.DS_Store
Thumbs.db
```

- [ ] **Step 2: Inicializar el repo del mundo**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
git init -b main
git config user.name "Sekees"
git config user.email "a.saumellortuno98@gmail.com"
git add -A
git commit -m "chore: mundo VALIO — docs de diseño, informe de mercado, skill y estructura inicial"
```

Expected: commit inicial con CLAUDE.md, README.md, docs/, data/README.md y .claude/.

- [ ] **Step 3: Excluir VALIO del repo paraguas**

En `f:/UNIVERSO/.gitignore`, añadir al bloque de mundos con repo propio:

```gitignore
SaaS-Empresas/VALIO/
```

Luego destrackear (los archivos se quedan en disco):

```bash
cd "f:/UNIVERSO"
git rm -r --cached "SaaS-Empresas/VALIO"
```

- [ ] **Step 4: Registrar el repo en `MANIFIESTO-REPOS.md`**

Añadir fila a la tabla de repos:

```markdown
| `Sekees/valio` (VALIO — valorador de inmuebles) | Sekees |
```

- [ ] **Step 5: Commit del paraguas**

```bash
cd "f:/UNIVERSO"
git add .gitignore MANIFIESTO-REPOS.md
git commit -m "chore(valio): VALIO pasa a repo propio; exclusión en paraguas + manifiesto"
```

- [ ] **Step 6 (requiere OK de Alex — acción externa): crear el remoto**

```bash
gh auth status   # verificar que la cuenta activa es Sekees
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
gh repo create Sekees/valio --private --source . --remote origin --push
```

Si Alex no da OK todavía, saltar este paso: todo lo demás funciona en local.

---

### Task 2: Scaffold Next.js 16 + Vitest

**Files:**
- Create: `app/` (scaffold completo de create-next-app)
- Create: `app/vitest.config.ts`
- Modify: `app/package.json` (script test)

- [ ] **Step 1: Scaffold**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
npx create-next-app@latest app --ts --app --tailwind --eslint --src-dir --no-import-alias --use-npm --yes
```

Expected: carpeta `app/` con `src/app/`, Tailwind y TS estricto.

- [ ] **Step 2: Instalar dependencias del plan**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO/app"
npm i zod @supabase/supabase-js @supabase/ssr
npm i -D vitest
```

- [ ] **Step 3: Configurar Vitest**

`app/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
```

En `app/package.json`, añadir a `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verificar que la app arranca**

```bash
npm run dev -- --port 3210
```

Expected: Next.js sirve en http://localhost:3210 sin errores. Parar con Ctrl+C.

- [ ] **Step 5: Commit**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
git add app
git commit -m "feat(app): scaffold Next.js 16 + Vitest"
```

---

### Task 3: Tipos de dominio del motor

**Files:**
- Create: `app/src/engine/types.ts`

- [ ] **Step 1: Escribir los tipos**

`app/src/engine/types.ts`:

```ts
/** Estados de ocupación — el ajuste por ocupación es diferenciador clave de VALIO. */
export type OccupancyStatus = 'libre' | 'alquilado' | 'ocupado'

export type ConditionRating = 'a_reformar' | 'buen_estado' | 'reformado' | 'obra_nueva'

export type PropertyKind = 'piso' | 'casa'

/** Inmueble a valorar (input del usuario, ya geolocalizado). */
export interface SubjectProperty {
  kind: PropertyKind
  builtAreaM2: number
  bedrooms: number
  /** null = no aplica (casa) */
  floor: number | null
  hasElevator: boolean | null
  yearBuilt: number | null
  condition: ConditionRating
  occupancy: OccupancyStatus
  lat: number
  lon: number
  /** Sección censal INE, ej. '0801902003' */
  censusSectionId: string
}

/** Testigo comparable, ya normalizado por la capa de ingesta. */
export interface Comparable {
  id: string
  kind: PropertyKind
  /** € totales (cierre u oferta según isClosingPrice) */
  price: number
  isClosingPrice: boolean
  builtAreaM2: number
  bedrooms: number | null
  floor: number | null
  hasElevator: boolean | null
  yearBuilt: number | null
  condition: ConditionRating | null
  occupancy: OccupancyStatus
  lat: number
  lon: number
  censusSectionId: string
  /** ISO date de observación (fecha cierre o última vista del anuncio) */
  observedAt: string
  source: string
  /** metros al subject; lo aporta la búsqueda espacial */
  distanceM: number
}

/** Features de zona precalculadas por sección censal (pipeline de zona). */
export interface ZoneStats {
  censusSectionId: string
  municipalityCode: string
  /** Renta neta media por persona (INE ADRH), € */
  netIncomePerCapita: number
  /** Renta del municipio, € — denominador del coeficiente */
  municipalityIncomePerCapita: number
  /** netIncomePerCapita / municipalityIncomePerCapita */
  incomeCoef: number
  /** Descuento medio oferta→cierre de la zona (0.06 = 6%) */
  negotiationDiscount: number
}

export interface Adjustment {
  concept:
    | 'oferta_a_cierre'
    | 'ocupacion'
    | 'estado'
    | 'planta_ascensor'
    | 'antiguedad'
    | 'superficie'
    | 'renta_zona'
  pct: number // -0.12 = -12%
}

export interface AdjustedComparable {
  comparable: Comparable
  adjustments: Adjustment[]
  adjustedPricePerM2: number
  /** peso por similitud (distancia, tamaño, antigüedad del dato, fiabilidad fuente) */
  weight: number
}

export type ConfidenceLevel = 'alta' | 'media' | 'baja'

export type ValuationOutcome =
  | {
      status: 'ok'
      value: number
      low: number
      high: number
      pricePerM2: number
      confidence: ConfidenceLevel
      /** Forecast Standard Deviation aprox. (CV ponderado de los testigos ajustados) */
      fsd: number
      /** Ajuste medio aplicado por renta de zona — la línea "±X% por renta de la zona" */
      zoneAdjustmentPct: number
      comparables: AdjustedComparable[]
    }
  | {
      status: 'rejected'
      reason: 'insufficient_comparables' | 'missing_zone_stats'
      found: number
      required: number
    }
```

- [ ] **Step 2: Verificar compilación**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO/app"
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
git add app/src/engine/types.ts
git commit -m "feat(engine): tipos de dominio del motor de valoración"
```

---

### Task 4: Coeficientes de calibración

Valores iniciales **heurísticos documentados** (fuente: informe de mercado 2026-07-06). Se recalibrarán con los cierres del socio en el Plan 2. Cambiar un coeficiente = cambiar este archivo + su test.

**Files:**
- Create: `app/src/engine/coefficients.ts`

- [ ] **Step 1: Escribir los coeficientes**

`app/src/engine/coefficients.ts`:

```ts
import type { ConditionRating, OccupancyStatus } from './types'

/** Calibración v0 (heurística, 2026-07-07). Recalibrar con cierres reales del socio. */

/** Prima/descuento sobre valor libre. Un ocupado se compra con fuerte descuento. */
export const OCCUPANCY_ADJ: Record<OccupancyStatus, number> = {
  libre: 0,
  alquilado: -0.15,
  ocupado: -0.4,
}

export const CONDITION_ADJ: Record<ConditionRating, number> = {
  a_reformar: -0.12,
  buen_estado: 0,
  reformado: 0.08,
  obra_nueva: 0.15,
}

/** Ajuste por planta: con ascensor suma por altura (vistas/luz), sin ascensor penaliza. */
export const FLOOR_WITH_ELEVATOR_PER_FLOOR = 0.01 // hasta +6%
export const FLOOR_WITH_ELEVATOR_CAP = 0.06
export const FLOOR_NO_ELEVATOR_PER_FLOOR = -0.02 // a partir de 1º

/** Antigüedad: ±2% por década de diferencia, tope ±10%. */
export const AGE_ADJ_PER_DECADE = 0.02
export const AGE_ADJ_CAP = 0.1

/** Superficie: los pisos pequeños valen más €/m². ±0.1%/m² de diferencia, tope ±8%. */
export const SIZE_ADJ_PER_M2 = 0.001
export const SIZE_ADJ_CAP = 0.08

/** Elasticidad del factor renta de zona: (coefSubject/coefComp)^ELASTICITY. */
export const ZONE_INCOME_ELASTICITY = 0.5

/** Descuento oferta→cierre por defecto si la zona no aporta el suyo. */
export const DEFAULT_NEGOTIATION_DISCOUNT = 0.06

/** Regla de oro: con menos de 6 testigos el motor rehúsa valorar. */
export const MIN_COMPARABLES = 6
export const MAX_COMPARABLES = 20

/** Umbrales de confianza (FSD ≈ CV ponderado). */
export const CONFIDENCE_HIGH = { maxFsd: 0.13, minComps: 10 }
export const CONFIDENCE_MEDIUM = { maxFsd: 0.2, minComps: 6 }

/** Filtros de candidatos. */
export const MAX_SIZE_DEVIATION = 0.4 // ±40% de superficie
export const MAX_OBSERVED_AGE_MONTHS = 18

/** Pesos de similitud. */
export const WEIGHT_DISTANCE_HALF_M = 500 // a 500 m el peso por distancia es 0.5
export const WEIGHT_SIZE_HALF_M2 = 50
export const WEIGHT_LISTING_SOURCE = 0.8 // un anuncio pesa menos que un cierre
```

- [ ] **Step 2: Compilar y commit**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO/app"
npx tsc --noEmit
cd ..
git add app/src/engine/coefficients.ts
git commit -m "feat(engine): coeficientes de calibración v0 documentados"
```

---

### Task 5: `homogenize()` — ajustes de un testigo (TDD)

Convierte el precio de un testigo a "condiciones del subject": oferta→cierre, ocupación, estado, planta, antigüedad, superficie y renta de zona. Multiplicativo, trazable.

**Files:**
- Create: `app/src/engine/homogenize.test.ts`
- Create: `app/src/engine/homogenize.ts`

- [ ] **Step 1: Escribir los tests (fallarán)**

`app/src/engine/homogenize.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { homogenize } from './homogenize'
import type { Comparable, SubjectProperty, ZoneStats } from './types'

const zone = (id: string, incomeCoef: number, negotiationDiscount = 0.06): ZoneStats => ({
  censusSectionId: id,
  municipalityCode: '08019',
  netIncomePerCapita: incomeCoef * 16000,
  municipalityIncomePerCapita: 16000,
  incomeCoef,
  negotiationDiscount,
})

const subject: SubjectProperty = {
  kind: 'piso',
  builtAreaM2: 80,
  bedrooms: 3,
  floor: 3,
  hasElevator: true,
  yearBuilt: 1970,
  condition: 'buen_estado',
  occupancy: 'libre',
  lat: 41.38,
  lon: 2.17,
  censusSectionId: 'S-SUBJECT',
}

const baseComp: Comparable = {
  id: 'c1',
  kind: 'piso',
  price: 320000, // 4.000 €/m²
  isClosingPrice: true,
  builtAreaM2: 80,
  bedrooms: 3,
  floor: 3,
  hasElevator: true,
  yearBuilt: 1970,
  condition: 'buen_estado',
  occupancy: 'libre',
  lat: 41.381,
  lon: 2.171,
  censusSectionId: 'S-SUBJECT',
  observedAt: '2026-06-01',
  source: 'socio',
  distanceM: 120,
}

describe('homogenize', () => {
  it('testigo idéntico en la misma zona → sin ajustes, mismo €/m²', () => {
    const r = homogenize(subject, baseComp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1))
    expect(r.adjustedPricePerM2).toBeCloseTo(4000, 6)
    expect(r.adjustments).toHaveLength(0)
  })

  it('anuncio (no cierre) → descuento de negociación de la zona del testigo', () => {
    const comp = { ...baseComp, isClosingPrice: false }
    const r = homogenize(subject, comp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1, 0.1))
    expect(r.adjustedPricePerM2).toBeCloseTo(4000 * 0.9, 6)
    expect(r.adjustments).toContainEqual({ concept: 'oferta_a_cierre', pct: -0.1 })
  })

  it('subject ocupado vs testigo libre → aplica el descuento de ocupación', () => {
    const occupiedSubject: SubjectProperty = { ...subject, occupancy: 'ocupado' }
    const r = homogenize(occupiedSubject, baseComp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1))
    // (1 + (-0.40)) / (1 + 0) = 0.60
    expect(r.adjustedPricePerM2).toBeCloseTo(4000 * 0.6, 6)
  })

  it('zona: subject en zona rica (coef 1.6) vs testigo en zona pobre (coef 0.64) → sube (ratio^0.5)', () => {
    const comp = { ...baseComp, censusSectionId: 'S-COMP' }
    const r = homogenize(subject, comp, zone('S-SUBJECT', 1.6), zone('S-COMP', 0.64))
    // (1.6/0.64)^0.5 = 2.5^0.5 ≈ 1.5811
    expect(r.adjustedPricePerM2).toBeCloseTo(4000 * Math.sqrt(2.5), 4)
    const zoneAdj = r.adjustments.find((a) => a.concept === 'renta_zona')
    expect(zoneAdj?.pct).toBeCloseTo(Math.sqrt(2.5) - 1, 4)
  })

  it('antigüedad: se capa a ±10%', () => {
    const comp = { ...baseComp, yearBuilt: 1900 } // 7 décadas → 14% > cap 10%
    const r = homogenize(subject, comp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1))
    const ageAdj = r.adjustments.find((a) => a.concept === 'antiguedad')
    expect(ageAdj?.pct).toBeCloseTo(0.1, 6)
  })

  it('planta sin ascensor: 4º sin ascensor penaliza -6% frente a 3º con ascensor +3%', () => {
    const comp = { ...baseComp, floor: 4, hasElevator: false }
    const r = homogenize(subject, comp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1))
    // score subject = +0.03 (3 plantas × 0.01), score comp = -0.06 (3 plantas sobre 1º × -0.02)
    // factor = 1.03 / 0.94
    expect(r.adjustedPricePerM2).toBeCloseTo(4000 * (1.03 / 0.94), 4)
  })

  it('superficie: testigo mayor que el subject → €/m² del subject algo mayor (capado ±8%)', () => {
    const comp = { ...baseComp, builtAreaM2: 200, price: 800000 } // 4.000 €/m²
    const r = homogenize(subject, comp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1))
    // diff = 200 - 80 = 120 m² → 12% > cap → +8%
    const sizeAdj = r.adjustments.find((a) => a.concept === 'superficie')
    expect(sizeAdj?.pct).toBeCloseTo(0.08, 6)
  })
})
```

- [ ] **Step 2: Verificar que fallan**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO/app"
npm test
```

Expected: FAIL — `Cannot find module './homogenize'`.

- [ ] **Step 3: Implementar**

`app/src/engine/homogenize.ts`:

```ts
import {
  AGE_ADJ_CAP,
  AGE_ADJ_PER_DECADE,
  CONDITION_ADJ,
  DEFAULT_NEGOTIATION_DISCOUNT,
  FLOOR_NO_ELEVATOR_PER_FLOOR,
  FLOOR_WITH_ELEVATOR_CAP,
  FLOOR_WITH_ELEVATOR_PER_FLOOR,
  OCCUPANCY_ADJ,
  SIZE_ADJ_CAP,
  SIZE_ADJ_PER_M2,
  ZONE_INCOME_ELASTICITY,
} from './coefficients'
import type { Adjustment, AdjustedComparable, Comparable, SubjectProperty, ZoneStats } from './types'

const clamp = (x: number, cap: number) => Math.min(cap, Math.max(-cap, x))

/** Score de planta: cuánto vale la altura de ESTE inmueble respecto a una planta baja tipo. */
function floorScore(floor: number | null, hasElevator: boolean | null): number {
  if (floor === null || floor <= 0) return 0
  if (hasElevator) {
    return Math.min(floor * FLOOR_WITH_ELEVATOR_PER_FLOOR, FLOOR_WITH_ELEVATOR_CAP)
  }
  // sin ascensor: penaliza cada planta por encima de la 1ª
  return Math.max(0, floor - 1) * FLOOR_NO_ELEVATOR_PER_FLOOR
}

/**
 * Homogeneiza un testigo a las condiciones del subject.
 * Cada ajuste es multiplicativo y queda registrado en `adjustments` (trazabilidad ECO-style).
 * El peso de similitud NO se calcula aquí (ver similarity.ts).
 */
export function homogenize(
  subject: SubjectProperty,
  comp: Comparable,
  subjectZone: ZoneStats,
  compZone: ZoneStats,
): Omit<AdjustedComparable, 'weight'> {
  const adjustments: Adjustment[] = []
  let pricePerM2 = comp.price / comp.builtAreaM2

  const apply = (concept: Adjustment['concept'], factor: number) => {
    if (Math.abs(factor - 1) < 1e-9) return
    adjustments.push({ concept, pct: factor - 1 })
    pricePerM2 *= factor
  }

  // 1. Oferta → cierre (si el testigo es un anuncio, con el descuento de SU zona)
  if (!comp.isClosingPrice) {
    const discount = compZone.negotiationDiscount ?? DEFAULT_NEGOTIATION_DISCOUNT
    apply('oferta_a_cierre', 1 - discount)
  }

  // 2. Ocupación: llevar el testigo a la situación del subject
  apply('ocupacion', (1 + OCCUPANCY_ADJ[subject.occupancy]) / (1 + OCCUPANCY_ADJ[comp.occupancy]))

  // 3. Estado de conservación (si el testigo no lo declara, se asume buen_estado)
  const compCondition = comp.condition ?? 'buen_estado'
  apply('estado', (1 + CONDITION_ADJ[subject.condition]) / (1 + CONDITION_ADJ[compCondition]))

  // 4. Planta / ascensor
  apply(
    'planta_ascensor',
    (1 + floorScore(subject.floor, subject.hasElevator)) / (1 + floorScore(comp.floor, comp.hasElevator)),
  )

  // 5. Antigüedad (solo si ambos años son conocidos)
  if (subject.yearBuilt !== null && comp.yearBuilt !== null) {
    const decades = (subject.yearBuilt - comp.yearBuilt) / 10
    apply('antiguedad', 1 + clamp(decades * AGE_ADJ_PER_DECADE, AGE_ADJ_CAP))
  }

  // 6. Superficie (elasticidad del €/m²: pisos pequeños valen más por m²)
  const sizeDiff = comp.builtAreaM2 - subject.builtAreaM2
  apply('superficie', 1 + clamp(sizeDiff * SIZE_ADJ_PER_M2, SIZE_ADJ_CAP))

  // 7. Renta de zona (el diferenciador de VALIO): ratio de coeficientes con elasticidad
  if (subjectZone.censusSectionId !== compZone.censusSectionId) {
    apply('renta_zona', Math.pow(subjectZone.incomeCoef / compZone.incomeCoef, ZONE_INCOME_ELASTICITY))
  }

  return { comparable: comp, adjustments, adjustedPricePerM2: pricePerM2 }
}
```

- [ ] **Step 4: Verificar que pasan**

```bash
npm test
```

Expected: PASS (7 tests de homogenize).

- [ ] **Step 5: Commit**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
git add app/src/engine/homogenize.ts app/src/engine/homogenize.test.ts
git commit -m "feat(engine): homogeneización de testigos con 7 ajustes trazables"
```

---

### Task 6: `similarity()` + `selectComparables()` (TDD)

Filtra candidatos no comparables y pondera por similitud.

**Files:**
- Create: `app/src/engine/similarity.test.ts`
- Create: `app/src/engine/similarity.ts`

- [ ] **Step 1: Tests (fallarán)**

`app/src/engine/similarity.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { comparableWeight, selectComparables } from './similarity'
import type { Comparable, SubjectProperty } from './types'

const subject: SubjectProperty = {
  kind: 'piso',
  builtAreaM2: 80,
  bedrooms: 3,
  floor: 3,
  hasElevator: true,
  yearBuilt: 1970,
  condition: 'buen_estado',
  occupancy: 'libre',
  lat: 41.38,
  lon: 2.17,
  censusSectionId: 'S1',
}

const mk = (over: Partial<Comparable>): Comparable => ({
  id: Math.random().toString(36).slice(2),
  kind: 'piso',
  price: 320000,
  isClosingPrice: true,
  builtAreaM2: 80,
  bedrooms: 3,
  floor: 3,
  hasElevator: true,
  yearBuilt: 1970,
  condition: 'buen_estado',
  occupancy: 'libre',
  lat: 41.381,
  lon: 2.171,
  censusSectionId: 'S1',
  observedAt: '2026-06-01',
  source: 'socio',
  distanceM: 100,
  ...over,
})

describe('comparableWeight', () => {
  it('un cierre cercano y del mismo tamaño pesa ~1', () => {
    expect(comparableWeight(subject, mk({ distanceM: 0 }))).toBeCloseTo(1, 2)
  })
  it('a 500 m el peso por distancia cae a la mitad', () => {
    expect(comparableWeight(subject, mk({ distanceM: 500 }))).toBeCloseTo(0.5, 2)
  })
  it('un anuncio pesa 0.8 frente a un cierre', () => {
    const closing = comparableWeight(subject, mk({ distanceM: 0 }))
    const listing = comparableWeight(subject, mk({ distanceM: 0, isClosingPrice: false }))
    expect(listing / closing).toBeCloseTo(0.8, 6)
  })
})

describe('selectComparables', () => {
  const now = new Date('2026-07-07')
  it('excluye tipología distinta, tamaños fuera de ±40% y datos de hace >18 meses', () => {
    const candidates = [
      mk({}), // válido
      mk({ kind: 'casa' }), // fuera: tipología
      mk({ builtAreaM2: 200 }), // fuera: 200 > 80×1.4
      mk({ observedAt: '2024-06-01' }), // fuera: >18 meses
    ]
    const r = selectComparables(subject, candidates, now)
    expect(r).toHaveLength(1)
  })
  it('ordena por peso descendente y corta en 20', () => {
    const candidates = Array.from({ length: 30 }, (_, i) => mk({ distanceM: i * 100 }))
    const r = selectComparables(subject, candidates, now)
    expect(r).toHaveLength(20)
    expect(r[0].distanceM).toBe(0)
  })
})
```

- [ ] **Step 2: Verificar que fallan**

```bash
npm test
```

Expected: FAIL — `Cannot find module './similarity'`.

- [ ] **Step 3: Implementar**

`app/src/engine/similarity.ts`:

```ts
import {
  MAX_COMPARABLES,
  MAX_OBSERVED_AGE_MONTHS,
  MAX_SIZE_DEVIATION,
  WEIGHT_DISTANCE_HALF_M,
  WEIGHT_LISTING_SOURCE,
  WEIGHT_SIZE_HALF_M2,
} from './coefficients'
import type { Comparable, SubjectProperty } from './types'

/** Peso de similitud ∈ (0, 1]: distancia, diferencia de tamaño y fiabilidad de la fuente. */
export function comparableWeight(subject: SubjectProperty, comp: Comparable): number {
  const wDistance = 1 / (1 + comp.distanceM / WEIGHT_DISTANCE_HALF_M)
  const wSize = 1 / (1 + Math.abs(comp.builtAreaM2 - subject.builtAreaM2) / WEIGHT_SIZE_HALF_M2)
  const wSource = comp.isClosingPrice ? 1 : WEIGHT_LISTING_SOURCE
  return wDistance * wSize * wSource
}

function monthsBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
}

/** Filtra candidatos no comparables y devuelve los MAX_COMPARABLES mejores por peso. */
export function selectComparables(
  subject: SubjectProperty,
  candidates: Comparable[],
  now: Date,
): Comparable[] {
  return candidates
    .filter((c) => c.kind === subject.kind)
    .filter(
      (c) =>
        c.builtAreaM2 >= subject.builtAreaM2 * (1 - MAX_SIZE_DEVIATION) &&
        c.builtAreaM2 <= subject.builtAreaM2 * (1 + MAX_SIZE_DEVIATION),
    )
    .filter((c) => monthsBetween(new Date(c.observedAt), now) <= MAX_OBSERVED_AGE_MONTHS)
    .sort((a, b) => comparableWeight(subject, b) - comparableWeight(subject, a))
    .slice(0, MAX_COMPARABLES)
}
```

- [ ] **Step 4: Verificar que pasan + commit**

```bash
npm test
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
git add app/src/engine/similarity.ts app/src/engine/similarity.test.ts
git commit -m "feat(engine): filtro y ponderación de testigos por similitud"
```

---

### Task 7: `synthesize()` — valor, horquilla, confianza (TDD)

Mediana ponderada de los €/m² ajustados; FSD ≈ CV ponderado; confianza por nº de testigos + dispersión; **rehúsa con <6**.

**Files:**
- Create: `app/src/engine/synthesize.test.ts`
- Create: `app/src/engine/synthesize.ts`

- [ ] **Step 1: Tests (fallarán)**

`app/src/engine/synthesize.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { synthesize, weightedMedian } from './synthesize'
import type { AdjustedComparable, Comparable } from './types'

const mkAdjusted = (pricePerM2: number, weight = 1): AdjustedComparable => ({
  comparable: { id: Math.random().toString(36).slice(2) } as Comparable,
  adjustments: [],
  adjustedPricePerM2: pricePerM2,
  weight,
})

describe('weightedMedian', () => {
  it('mediana simple con pesos iguales', () => {
    expect(weightedMedian([1000, 2000, 3000], [1, 1, 1])).toBe(2000)
  })
  it('un peso dominante arrastra la mediana', () => {
    expect(weightedMedian([1000, 2000, 3000], [10, 1, 1])).toBe(1000)
  })
})

describe('synthesize', () => {
  it('con <6 testigos rehúsa valorar (regla de oro)', () => {
    const r = synthesize(80, Array.from({ length: 5 }, () => mkAdjusted(4000)), 0)
    expect(r.status).toBe('rejected')
    if (r.status === 'rejected') {
      expect(r.reason).toBe('insufficient_comparables')
      expect(r.found).toBe(5)
      expect(r.required).toBe(6)
    }
  })

  it('10 testigos homogéneos → confianza alta y horquilla estrecha', () => {
    const comps = Array.from({ length: 10 }, (_, i) => mkAdjusted(4000 + (i % 2 === 0 ? 100 : -100)))
    const r = synthesize(80, comps, 0.05)
    expect(r.status).toBe('ok')
    if (r.status === 'ok') {
      // mediana ponderada de valores alternos 3900/4100 → cae en uno de los dos
      expect(r.pricePerM2).toBeGreaterThanOrEqual(3900)
      expect(r.pricePerM2).toBeLessThanOrEqual(4100)
      expect(r.value).toBe(r.pricePerM2 * 80)
      expect(r.confidence).toBe('alta')
      expect(r.low).toBeLessThan(r.value)
      expect(r.high).toBeGreaterThan(r.value)
      expect(r.zoneAdjustmentPct).toBe(0.05)
    }
  })

  it('7 testigos dispersos → confianza media o baja, nunca alta', () => {
    const prices = [2800, 3200, 3900, 4100, 4800, 5300, 5900]
    const r = synthesize(80, prices.map((p) => mkAdjusted(p)), 0)
    expect(r.status).toBe('ok')
    if (r.status === 'ok') expect(r.confidence).not.toBe('alta')
  })
})
```

- [ ] **Step 2: Verificar que fallan**

```bash
npm test
```

Expected: FAIL — `Cannot find module './synthesize'`.

- [ ] **Step 3: Implementar**

`app/src/engine/synthesize.ts`:

```ts
import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM, MIN_COMPARABLES } from './coefficients'
import type { AdjustedComparable, ConfidenceLevel, ValuationOutcome } from './types'

/** Mediana ponderada: primer valor cuyo peso acumulado alcanza el 50%. */
export function weightedMedian(values: number[], weights: number[]): number {
  const pairs = values.map((v, i) => [v, weights[i]] as const).sort((a, b) => a[0] - b[0])
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let acc = 0
  for (const [v, w] of pairs) {
    acc += w
    if (acc >= total / 2) return v
  }
  return pairs[pairs.length - 1][0]
}

function confidence(n: number, fsd: number): ConfidenceLevel {
  if (n >= CONFIDENCE_HIGH.minComps && fsd <= CONFIDENCE_HIGH.maxFsd) return 'alta'
  if (n >= CONFIDENCE_MEDIUM.minComps && fsd <= CONFIDENCE_MEDIUM.maxFsd) return 'media'
  return 'baja'
}

export function synthesize(
  subjectAreaM2: number,
  adjusted: AdjustedComparable[],
  zoneAdjustmentPct: number,
): ValuationOutcome {
  if (adjusted.length < MIN_COMPARABLES) {
    return {
      status: 'rejected',
      reason: 'insufficient_comparables',
      found: adjusted.length,
      required: MIN_COMPARABLES,
    }
  }

  const prices = adjusted.map((a) => a.adjustedPricePerM2)
  const weights = adjusted.map((a) => a.weight)
  const totalW = weights.reduce((s, w) => s + w, 0)

  const pricePerM2 = weightedMedian(prices, weights)
  const mean = prices.reduce((s, p, i) => s + p * weights[i], 0) / totalW
  const variance = prices.reduce((s, p, i) => s + weights[i] * (p - mean) ** 2, 0) / totalW
  const fsd = Math.sqrt(variance) / mean

  const value = pricePerM2 * subjectAreaM2
  return {
    status: 'ok',
    value: Math.round(value),
    low: Math.round(value * (1 - fsd)),
    high: Math.round(value * (1 + fsd)),
    pricePerM2: Math.round(pricePerM2),
    confidence: confidence(adjusted.length, fsd),
    fsd: Number(fsd.toFixed(4)),
    zoneAdjustmentPct,
    comparables: adjusted,
  }
}
```

- [ ] **Step 4: Verificar que pasan + commit**

```bash
npm test
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
git add app/src/engine/synthesize.ts app/src/engine/synthesize.test.ts
git commit -m "feat(engine): síntesis con mediana ponderada, FSD y regla de 6 testigos"
```

---

### Task 8: `valuate()` — orquestador puro (TDD, integración)

**Files:**
- Create: `app/src/engine/valuate.test.ts`
- Create: `app/src/engine/valuate.ts`

- [ ] **Step 1: Tests (fallarán)**

`app/src/engine/valuate.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { valuate } from './valuate'
import type { Comparable, SubjectProperty, ZoneStats } from './types'

const zones = new Map<string, ZoneStats>([
  ['RAVAL', { censusSectionId: 'RAVAL', municipalityCode: '08019', netIncomePerCapita: 9800, municipalityIncomePerCapita: 16000, incomeCoef: 0.6125, negotiationDiscount: 0.08 }],
  ['SARRIA', { censusSectionId: 'SARRIA', municipalityCode: '08019', netIncomePerCapita: 26500, municipalityIncomePerCapita: 16000, incomeCoef: 1.6562, negotiationDiscount: 0.03 }],
])

const subjectRaval: SubjectProperty = {
  kind: 'piso', builtAreaM2: 75, bedrooms: 3, floor: 2, hasElevator: false,
  yearBuilt: 1950, condition: 'buen_estado', occupancy: 'libre',
  lat: 41.3797, lon: 2.1682, censusSectionId: 'RAVAL',
}

const mkComp = (id: string, over: Partial<Comparable>): Comparable => ({
  id, kind: 'piso', price: 300000, isClosingPrice: false, builtAreaM2: 75,
  bedrooms: 3, floor: 2, hasElevator: false, yearBuilt: 1950,
  condition: 'buen_estado', occupancy: 'libre', lat: 41.3797, lon: 2.1682,
  censusSectionId: 'RAVAL', observedAt: '2026-05-15', source: 'seed', distanceM: 200,
  ...over,
})

const now = new Date('2026-07-07')

describe('valuate (integración)', () => {
  it('valora un piso del Raval con 8 testigos de la zona', () => {
    const candidates = Array.from({ length: 8 }, (_, i) =>
      mkComp(`r${i}`, { price: 290000 + i * 5000, distanceM: 100 + i * 50 }),
    )
    const r = valuate(subjectRaval, candidates, zones, now)
    expect(r.status).toBe('ok')
    if (r.status === 'ok') {
      // anuncios con 8% de descuento de zona: ~3.867 €/m² × 0.92 ≈ 3.560-3.700 €/m²
      expect(r.pricePerM2).toBeGreaterThan(3300)
      expect(r.pricePerM2).toBeLessThan(3900)
      expect(r.comparables.length).toBe(8)
    }
  })

  it('el mismo piso físico vale MÁS si sus testigos vienen de zona rica (factor renta)', () => {
    const ravalComps = Array.from({ length: 8 }, (_, i) => mkComp(`r${i}`, {}))
    const sarriaComps = Array.from({ length: 8 }, (_, i) =>
      mkComp(`s${i}`, { censusSectionId: 'SARRIA' }),
    )
    const withRaval = valuate(subjectRaval, ravalComps, zones, now)
    const subjectSarria = { ...subjectRaval, censusSectionId: 'SARRIA' }
    const withSarria = valuate(subjectSarria, sarriaComps, zones, now)
    if (withRaval.status === 'ok' && withSarria.status === 'ok') {
      // mismos testigos nominales, pero el descuento oferta→cierre de Sarrià (3%) es menor que el del Raval (8%)
      expect(withSarria.pricePerM2).toBeGreaterThan(withRaval.pricePerM2)
    } else {
      throw new Error('ambas valoraciones deberían ser ok')
    }
  })

  it('sin zone_stats del subject → rejected missing_zone_stats', () => {
    const r = valuate({ ...subjectRaval, censusSectionId: 'DESCONOCIDA' }, [], zones, now)
    expect(r.status).toBe('rejected')
    if (r.status === 'rejected') expect(r.reason).toBe('missing_zone_stats')
  })

  it('con 5 candidatos válidos → rejected insufficient_comparables', () => {
    const candidates = Array.from({ length: 5 }, (_, i) => mkComp(`r${i}`, {}))
    const r = valuate(subjectRaval, candidates, zones, now)
    expect(r.status).toBe('rejected')
  })
})
```

- [ ] **Step 2: Verificar que fallan**

```bash
npm test
```

Expected: FAIL — `Cannot find module './valuate'`.

- [ ] **Step 3: Implementar**

`app/src/engine/valuate.ts`:

```ts
import { homogenize } from './homogenize'
import { comparableWeight, selectComparables } from './similarity'
import { synthesize } from './synthesize'
import type { Comparable, SubjectProperty, ValuationOutcome, ZoneStats } from './types'

/**
 * Orquestador puro del motor: filtra → homogeneiza → pondera → sintetiza.
 * No toca DB ni red: los candidatos y las zonas llegan resueltos (ver data/comparables.ts).
 */
export function valuate(
  subject: SubjectProperty,
  candidates: Comparable[],
  zones: Map<string, ZoneStats>,
  now: Date,
): ValuationOutcome {
  const subjectZone = zones.get(subject.censusSectionId)
  if (!subjectZone) {
    return { status: 'rejected', reason: 'missing_zone_stats', found: 0, required: 1 }
  }

  const usable = selectComparables(subject, candidates, now).filter((c) =>
    zones.has(c.censusSectionId),
  )

  const adjusted = usable.map((comp) => ({
    ...homogenize(subject, comp, subjectZone, zones.get(comp.censusSectionId)!),
    weight: comparableWeight(subject, comp),
  }))

  const zoneAdjustments = adjusted
    .flatMap((a) => a.adjustments)
    .filter((a) => a.concept === 'renta_zona')
  const zoneAdjustmentPct =
    zoneAdjustments.length === 0
      ? 0
      : zoneAdjustments.reduce((s, a) => s + a.pct, 0) / zoneAdjustments.length

  return synthesize(subject.builtAreaM2, adjusted, Number(zoneAdjustmentPct.toFixed(4)))
}
```

- [ ] **Step 4: Verificar que TODOS los tests del motor pasan + commit**

```bash
npm test
```

Expected: PASS — homogenize (7) + similarity (5) + synthesize (5) + valuate (4).

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
git add app/src/engine/valuate.ts app/src/engine/valuate.test.ts
git commit -m "feat(engine): orquestador valuate() — motor completo y testeado"
```

---

### Task 9: Migraciones Supabase (0001–0003)

Migraciones numeradas correlativas (convención OFISAT: **nunca editar una aplicada**). RLS en todas las tablas.

**Files:**
- Create: `supabase/migrations/0001_extensions_workspaces.sql`
- Create: `supabase/migrations/0002_core_valuation.sql`
- Create: `supabase/migrations/0003_fn_comparables_within.sql`

- [ ] **Step 1: Migración 0001 — extensiones, workspaces, members, RLS**

`supabase/migrations/0001_extensions_workspaces.sql`:

```sql
-- VALIO 0001 — extensiones + multi-tenancy base
create extension if not exists postgis;
create extension if not exists pgcrypto;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Helper: workspace del usuario autenticado (una membresía por usuario en MVP)
create or replace function public.auth_workspace_id()
returns uuid language sql stable security definer set search_path = public as $$
  select workspace_id from public.members where user_id = auth.uid() limit 1
$$;

alter table public.workspaces enable row level security;
alter table public.members enable row level security;

create policy "workspace propio" on public.workspaces
  for all using (id = public.auth_workspace_id());

create policy "members del workspace" on public.members
  for select using (workspace_id = public.auth_workspace_id());

-- Al registrarse un usuario: crear workspace + membresía owner
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare ws_id uuid;
begin
  insert into public.workspaces (name)
    values (coalesce(new.raw_user_meta_data->>'workspace_name', 'Mi workspace'))
    returning id into ws_id;
  insert into public.members (workspace_id, user_id, role) values (ws_id, new.id, 'owner');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Migración 0002 — tablas de valoración**

`supabase/migrations/0002_core_valuation.sql`:

```sql
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
```

- [ ] **Step 3: Migración 0003 — búsqueda espacial**

`supabase/migrations/0003_fn_comparables_within.sql`:

```sql
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
```

- [ ] **Step 4: Commit**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
git add supabase/migrations
git commit -m "feat(db): migraciones 0001-0003 — multi-tenant RLS, comparables PostGIS y RPC de radio"
```

---

### Task 10: Seeds de desarrollo (Barcelona sintético)

Datos **SINTÉTICOS pero verosímiles** para probar el flujo completo. Etiquetados `source='seed'` para poder purgarlos.

**Files:**
- Create: `supabase/scripts/seed-dev.sql`

- [ ] **Step 1: Escribir el seed**

`supabase/scripts/seed-dev.sql`:

```sql
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
```

- [ ] **Step 2: Commit**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
git add supabase/scripts/seed-dev.sql
git commit -m "feat(db): seed sintético de desarrollo (Raval, Sarrià, Cornellà)"
```

---

### Task 11: Setup manual de Supabase (ACCIÓN DE ALEX — Fase 1)

Sin código: checklist para Alex. El ejecutor PARA aquí y se lo pide.

- [ ] **Step 1: Alex crea el proyecto**

1. https://supabase.com → New project → nombre `valio` (org de OBX), región `eu-west` (más cercana).
2. Database → Extensions → activar **postgis**.
3. SQL Editor → pegar y ejecutar **en orden**: `0001_extensions_workspaces.sql`, `0002_core_valuation.sql`, `0003_fn_comparables_within.sql`, y después `seed-dev.sql`.
4. Authentication → Providers → Email → activar (con magic link).

- [ ] **Step 2: Credenciales en local**

Crear `app/.env.local` (NUNCA commitear):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

- [ ] **Step 3: Verificar**

En el SQL Editor de Supabase:

```sql
select count(*) from public.zone_stats;      -- esperado: 3
select count(*) from public.comparables;     -- esperado: 24
select count(*) from public.comparables_within(41.3797, 2.1682, 1500, 'piso'); -- esperado: 8 (Raval)
```

---

### Task 12: Cliente Supabase + capa de datos

**Files:**
- Create: `app/src/lib/supabase/server.ts`
- Create: `app/src/data/comparables.ts`

- [ ] **Step 1: Cliente de servidor**

`app/src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => {
          try {
            all.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // llamado desde un Server Component: el middleware refresca la sesión
          }
        },
      },
    },
  )
}
```

- [ ] **Step 2: Capa de datos (RPC + zone_stats → tipos del motor)**

`app/src/data/comparables.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Comparable, PropertyKind, ZoneStats } from '@/engine/types'

interface ComparableRow {
  id: string
  kind: PropertyKind
  price: number
  is_closing_price: boolean
  built_area_m2: number
  bedrooms: number | null
  floor: number | null
  has_elevator: boolean | null
  year_built: number | null
  condition: Comparable['condition']
  occupancy: Comparable['occupancy']
  lat: number
  lon: number
  census_section_id: string
  observed_at: string
  source: string
  distance_m: number
}

export async function fetchCandidates(
  supabase: SupabaseClient,
  params: { lat: number; lon: number; radiusM: number; kind: PropertyKind },
): Promise<Comparable[]> {
  const { data, error } = await supabase.rpc('comparables_within', {
    p_lat: params.lat,
    p_lon: params.lon,
    p_radius_m: params.radiusM,
    p_kind: params.kind,
  })
  if (error) throw new Error(`comparables_within: ${error.message}`)
  return ((data ?? []) as ComparableRow[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    price: Number(r.price),
    isClosingPrice: r.is_closing_price,
    builtAreaM2: Number(r.built_area_m2),
    bedrooms: r.bedrooms,
    floor: r.floor,
    hasElevator: r.has_elevator,
    yearBuilt: r.year_built,
    condition: r.condition,
    occupancy: r.occupancy,
    lat: r.lat,
    lon: r.lon,
    censusSectionId: r.census_section_id,
    observedAt: r.observed_at,
    source: r.source,
    distanceM: Number(r.distance_m),
  }))
}

export async function fetchZoneStats(supabase: SupabaseClient): Promise<Map<string, ZoneStats>> {
  const { data, error } = await supabase.from('zone_stats').select('*')
  if (error) throw new Error(`zone_stats: ${error.message}`)
  return new Map(
    (data ?? []).map((z) => [
      z.census_section_id as string,
      {
        censusSectionId: z.census_section_id,
        municipalityCode: z.municipality_code,
        netIncomePerCapita: Number(z.net_income_per_capita),
        municipalityIncomePerCapita: Number(z.municipality_income_per_capita),
        incomeCoef: Number(z.income_coef),
        negotiationDiscount: Number(z.negotiation_discount),
      } satisfies ZoneStats,
    ]),
  )
}
```

- [ ] **Step 3: Compilar + commit**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO/app"
npx tsc --noEmit
cd ..
git add app/src/lib app/src/data
git commit -m "feat(data): cliente Supabase SSR y capa de datos del motor"
```

---

### Task 13: Login con magic link

**Files:**
- Create: `app/src/app/login/page.tsx`
- Create: `app/src/app/login/actions.ts`
- Create: `app/src/app/auth/confirm/route.ts`

- [ ] **Step 1: Server action de login**

`app/src/app/login/actions.ts`:

```ts
'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({ email: z.string().email('Email no válido') })

export async function sendMagicLink(
  _prev: { message: string } | null,
  formData: FormData,
): Promise<{ message: string }> {
  const parsed = schema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { message: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/confirm` },
  })
  if (error) return { message: `Error: ${error.message}` }
  return { message: 'Revisa tu correo: te hemos enviado un enlace de acceso.' }
}
```

- [ ] **Step 2: Página de login**

`app/src/app/login/page.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import { sendMagicLink } from './actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(sendMagicLink, null)
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">VALIO — acceso</h1>
      <form action={action} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
          className="rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Enviando…' : 'Enviar enlace de acceso'}
        </button>
      </form>
      {state && <p className="text-sm text-gray-600">{state.message}</p>}
    </main>
  )
}
```

- [ ] **Step 3: Callback de confirmación**

`app/src/app/auth/confirm/route.ts`:

```ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) redirect('/valorar')
  }
  redirect('/login')
}
```

- [ ] **Step 4: Compilar + commit**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO/app"
npx tsc --noEmit
cd ..
git add app/src/app/login app/src/app/auth
git commit -m "feat(auth): login con magic link y callback de confirmación"
```

---

### Task 14: Página /valorar — formulario + resultado

**Files:**
- Create: `app/src/app/valorar/actions.ts`
- Create: `app/src/app/valorar/page.tsx`
- Create: `app/src/components/Disclaimer.tsx`

- [ ] **Step 1: Server action de valoración**

`app/src/app/valorar/actions.ts`:

```ts
'use server'

import { z } from 'zod'
import { fetchCandidates, fetchZoneStats } from '@/data/comparables'
import { valuate } from '@/engine/valuate'
import type { SubjectProperty, ValuationOutcome } from '@/engine/types'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  kind: z.enum(['piso', 'casa']),
  builtAreaM2: z.coerce.number().min(15).max(2000),
  bedrooms: z.coerce.number().int().min(0).max(20),
  floor: z.coerce.number().int().min(0).max(40).nullable(),
  hasElevator: z.coerce.boolean(),
  yearBuilt: z.coerce.number().int().min(1800).max(2026).nullable(),
  condition: z.enum(['a_reformar', 'buen_estado', 'reformado', 'obra_nueva']),
  occupancy: z.enum(['libre', 'alquilado', 'ocupado']),
  lat: z.coerce.number().min(35).max(44),
  lon: z.coerce.number().min(-10).max(5),
  censusSectionId: z.string().min(1),
})

export type ValuationFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'done'; outcome: ValuationOutcome }

export async function runValuation(
  _prev: ValuationFormState,
  formData: FormData,
): Promise<ValuationFormState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = schema.safeParse({
    ...raw,
    floor: raw.floor === '' ? null : raw.floor,
    yearBuilt: raw.yearBuilt === '' ? null : raw.yearBuilt,
    hasElevator: raw.hasElevator === 'on',
  })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { status: 'error', message: 'Inicia sesión para valorar.' }

  const subject: SubjectProperty = parsed.data
  try {
    const [candidates, zones] = await Promise.all([
      fetchCandidates(supabase, { lat: subject.lat, lon: subject.lon, radiusM: 1500, kind: subject.kind }),
      fetchZoneStats(supabase),
    ])
    const outcome = valuate(subject, candidates, zones, new Date())
    return { status: 'done', outcome }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Error inesperado' }
  }
}
```

- [ ] **Step 2: Disclaimer legal (obligatorio en todo output con valor)**

`app/src/components/Disclaimer.tsx`:

```tsx
export function Disclaimer() {
  return (
    <p className="mt-4 rounded-md bg-amber-50 p-3 text-xs text-amber-900">
      Valoración <strong>orientativa</strong> generada automáticamente a partir de testigos
      comparables y datos públicos. No es una tasación oficial ni sustituye el informe de una
      sociedad de tasación homologada por el Banco de España (Orden ECO/805/2003).
    </p>
  )
}
```

- [ ] **Step 3: Página**

`app/src/app/valorar/page.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import { Disclaimer } from '@/components/Disclaimer'
import { runValuation, type ValuationFormState } from './actions'

const eur = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const pct = (n: number) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`

export default function ValorarPage() {
  const [state, action, pending] = useActionState<ValuationFormState, FormData>(runValuation, { status: 'idle' })

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Valorar inmueble</h1>

      <form action={action} className="grid grid-cols-2 gap-3">
        <select name="kind" className="rounded-md border px-3 py-2" defaultValue="piso">
          <option value="piso">Piso</option>
          <option value="casa">Casa</option>
        </select>
        <input name="builtAreaM2" type="number" placeholder="m² construidos" required className="rounded-md border px-3 py-2" />
        <input name="bedrooms" type="number" placeholder="Habitaciones" required className="rounded-md border px-3 py-2" />
        <input name="floor" type="number" placeholder="Planta (vacío si casa)" className="rounded-md border px-3 py-2" />
        <label className="flex items-center gap-2 text-sm">
          <input name="hasElevator" type="checkbox" /> Ascensor
        </label>
        <input name="yearBuilt" type="number" placeholder="Año construcción" className="rounded-md border px-3 py-2" />
        <select name="condition" className="rounded-md border px-3 py-2" defaultValue="buen_estado">
          <option value="a_reformar">A reformar</option>
          <option value="buen_estado">Buen estado</option>
          <option value="reformado">Reformado</option>
          <option value="obra_nueva">Obra nueva</option>
        </select>
        <select name="occupancy" className="rounded-md border px-3 py-2" defaultValue="libre">
          <option value="libre">Libre</option>
          <option value="alquilado">Alquilado</option>
          <option value="ocupado">Ocupado</option>
        </select>
        <input name="lat" type="number" step="any" placeholder="Latitud (ej. 41.3797)" required className="rounded-md border px-3 py-2" />
        <input name="lon" type="number" step="any" placeholder="Longitud (ej. 2.1682)" required className="rounded-md border px-3 py-2" />
        {/* Plan 2: se resuelve automáticamente geocodificando la dirección */}
        <select name="censusSectionId" className="col-span-2 rounded-md border px-3 py-2" defaultValue="SEED-RAVAL">
          <option value="SEED-RAVAL">Zona demo: Raval (41.3797, 2.1682)</option>
          <option value="SEED-SARRIA">Zona demo: Sarrià (41.3990, 2.1210)</option>
          <option value="SEED-CORNELLA">Zona demo: Cornellà (41.3560, 2.0750)</option>
        </select>
        <button type="submit" disabled={pending} className="col-span-2 rounded-md bg-black px-3 py-2 text-white disabled:opacity-50">
          {pending ? 'Valorando…' : 'Valorar'}
        </button>
      </form>

      {state.status === 'error' && <p className="text-sm text-red-600">{state.message}</p>}

      {state.status === 'done' && state.outcome.status === 'rejected' && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">No podemos valorar este inmueble con rigor.</p>
          <p className="text-sm text-red-700">
            {state.outcome.reason === 'insufficient_comparables'
              ? `Solo hay ${state.outcome.found} testigos comparables (mínimo ${state.outcome.required}). Mejor no valorar que valorar mal.`
              : 'No tenemos estadísticas de esta zona todavía.'}
          </p>
        </div>
      )}

      {state.status === 'done' && state.outcome.status === 'ok' && (
        <section className="space-y-4">
          <div className="rounded-lg border p-5">
            <p className="text-sm text-gray-500">Valor estimado</p>
            <p className="text-4xl font-semibold">{eur(state.outcome.value)}</p>
            <p className="text-sm text-gray-600">
              Horquilla {eur(state.outcome.low)} – {eur(state.outcome.high)} · {eur(state.outcome.pricePerM2)}/m² ·
              Confianza <strong>{state.outcome.confidence}</strong>
            </p>
            <p className="mt-2 text-sm">
              Ajuste por renta de la zona: <strong>{pct(state.outcome.zoneAdjustmentPct)}</strong>
            </p>
          </div>

          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer font-medium">
              {state.outcome.comparables.length} testigos utilizados
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              {state.outcome.comparables.map((c) => (
                <li key={c.comparable.id} className="rounded border p-2">
                  <span className="font-medium">{eur(Math.round(c.adjustedPricePerM2))}/m² ajustado</span>
                  {' · '}{c.comparable.builtAreaM2} m² · a {Math.round(c.comparable.distanceM)} m ·{' '}
                  {c.comparable.isClosingPrice ? 'cierre' : 'anuncio'} · fuente {c.comparable.source}
                  {c.adjustments.length > 0 && (
                    <span className="block text-xs text-gray-500">
                      {c.adjustments.map((a) => `${a.concept} ${pct(a.pct)}`).join(' · ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </details>

          <Disclaimer />
        </section>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Compilar + commit**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO/app"
npx tsc --noEmit
cd ..
git add app/src/app/valorar app/src/components
git commit -m "feat(ui): página /valorar con resultado, testigos, ajustes y disclaimer"
```

---

### Task 15: Persistir la valoración + verificación final

**Files:**
- Modify: `app/src/app/valorar/actions.ts` (persistencia tras valorar)

- [ ] **Step 1: Persistir property + valuation**

En `app/src/app/valorar/actions.ts`, dentro de `runValuation`, sustituir el bloque `try` por:

```ts
  try {
    const [candidates, zones] = await Promise.all([
      fetchCandidates(supabase, { lat: subject.lat, lon: subject.lon, radiusM: 1500, kind: subject.kind }),
      fetchZoneStats(supabase),
    ])
    const outcome = valuate(subject, candidates, zones, new Date())

    // Persistencia (snapshot reproducible). El workspace lo resuelve la RLS.
    const { data: member } = await supabase.from('members').select('workspace_id').limit(1).single()
    if (member) {
      const { data: property } = await supabase
        .from('properties')
        .insert({
          workspace_id: member.workspace_id,
          kind: subject.kind,
          address: '(pendiente de geocodificación — Plan 2)',
          built_area_m2: subject.builtAreaM2,
          bedrooms: subject.bedrooms,
          floor: subject.floor,
          has_elevator: subject.hasElevator,
          year_built: subject.yearBuilt,
          condition: subject.condition,
          occupancy: subject.occupancy,
          lat: subject.lat,
          lon: subject.lon,
          census_section_id: subject.censusSectionId,
        })
        .select('id')
        .single()
      if (property) {
        await supabase.from('valuations').insert({
          workspace_id: member.workspace_id,
          property_id: property.id,
          outcome,
          engine_version: 'v0-comparables',
        })
      }
    }

    return { status: 'done', outcome }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Error inesperado' }
  }
```

- [ ] **Step 2: Suite completa + build**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO/app"
npm test
npm run build
```

Expected: tests PASS y build sin errores.

- [ ] **Step 3: Smoke test manual (requiere Task 11 hecho por Alex)**

1. `npm run dev` → http://localhost:3000/login → magic link → llega a `/valorar`.
2. Valorar: piso 75 m², 3 hab, planta 2, sin ascensor, 1950, buen estado, **libre**, lat `41.3797`, lon `2.1682`, zona Raval → esperado: valor ~250–290k €, confianza media/alta, 8 testigos, disclaimer visible.
3. Repetir con **ocupado** → esperado: valor ~40% inferior.
4. Valorar en lat `41.3990`, lon `2.1210`, zona Sarrià (90 m², 3 hab, planta 2, ascensor, 1975) → esperado: €/m² claramente superior al Raval.
5. Valorar en lat `40.0`, lon `-3.0` (sin testigos) → esperado: mensaje de rechazo por falta de testigos.
6. En Supabase: `select count(*) from valuations;` → una fila por valoración hecha.

- [ ] **Step 4: Commit final + actualizar estado del mundo**

```bash
cd "f:/UNIVERSO/SaaS-Empresas/VALIO"
git add app/src/app/valorar/actions.ts
git commit -m "feat(valorar): persistencia de property + valuation (snapshot reproducible)"
```

Actualizar la sección **Estado** del `CLAUDE.md` del mundo: "Plan 1 completado (motor + flujo de valoración con seeds). Siguiente: Plan 2 (ingesta de datos reales)."

```bash
git add CLAUDE.md
git commit -m "docs: estado del mundo tras completar Plan 1"
```

---

## Fuera de alcance de este plan

- **Plan 2 — Ingesta real:** importador CSV/XLSX del socio (mapeo asistido), ETLs INE ADRH + SERPAVI + Registradores + MIVAU + Open Data BCN, shapefiles de secciones censales en PostGIS (geocodificación dirección → sección censal automática), adapter Catastro OVC con caché, adapters de las APIs del socio.
- **Plan 3 — Capa comercial:** Stripe (3 tiers + trial 14 días), informe PDF white-label, landing con pricing público, onboarding wizard, RGPD/consentimientos, deploy Vercel.
