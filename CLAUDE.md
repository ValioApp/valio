# CLAUDE.md — VALIO (valorador orientativo de inmuebles)

> **Mundo:** SaaS de valoración orientativa de inmuebles para España (pisos, casas y —
> en v1.5 — naves industriales/polígonos) con **factor zona explicable** (renta por
> sección censal del INE) y fusión de **datos propios del cliente** (CSV/cierres reales
> del socio). Idioma: **español siempre**.

---

## Para qué es esto

Valorar inmuebles con valor + horquilla + confianza + testigos + desglose de ajustes,
incluyendo lo que nadie da a agencias e inversores: *"ajuste por renta de la zona: +X%"*
y ajuste por **estado de ocupación**. Multi-tenant, Stripe, pricing público self-service
(los competidores esconden precios). MVP: residencial en Barcelona + área metropolitana,
escalable por zonas a Cataluña → España.

**Doc canónico del diseño:** `docs/2026-07-06-valio-design.md` (spec aprobado).
**Investigación de mercado:** `docs/2026-07-06-informe-mercado.md` (fuentes de datos,
competidores, metodología AVM, legal — verificado 2026-07-06).

## Reglas de oro (no negociables)

1. **NUNCA scraping de portales en producción** (ToS + doctrina Ryanair + sui generis
   BD = demandable). Comparables solo por: adapters con API/claves legítimas, CSV del
   socio, open data, o agregador contratado.
2. **Jamás la palabra "tasación"** en producto, marketing o informes: siempre
   "valoración orientativa" + disclaimer visible (ECO/805/2003 y ECM/599/2025 reservan
   la tasación a sociedades homologadas por el Banco de España).
3. **Con <6 testigos el motor rehúsa valorar** (o degrada a "orientación de zona").
4. Registradores (ODbL share-alike): solo capa de calibración agregada, nunca integrar
   su BD en la BD del producto.
5. RGPD: ingesta del CSV del socio anonimizada (inmueble+precio+fecha, sin partes).
6. RLS en todas las tablas; multi-tenant por `workspace_id`; nunca hardcodear secrets
   (credenciales de adapters en vault/env, jamás en tablas planas ni en git).
7. Métricas de calidad (MdAPE/PPE10) siempre contra precios de CIERRE, nunca contra
   precios de anuncio.

## Stack

Next.js 16 (App Router) + TS estricto + Tailwind + shadcn/ui · Supabase (Postgres +
**PostGIS** + Auth + RLS + Storage) · Stripe (3 tiers + trial 14 días) · n8n (ETLs de
datos públicos) · v2: servicio Python LightGBM (VPS/EasyPanel).
Patrones multi-tenant/RBAC/Stripe: seguir las convenciones de `crm-ai-native/`.

## Conexiones

- **Supabase** (proyecto propio de VALIO; credenciales en `app/.env.local`).
- **Stripe** (billing).
- **n8n** (instancia OBX) — ETLs programados: INE ADRH, SERPAVI, Registradores, MIVAU,
  Open Data BCN (algunas fuentes con WAF → proceso semi-manual documentado).
- **Catastro OVC** — REST libre sin key, con caché.
- **APIs del socio** (Idealista, Fotocasa…): pendientes de que Alex reciba las claves;
  entran como adapters `ComparableSource` sin tocar el motor.
- **Fase 2**: un agregador de pago (idealista/data ↔ DataVenues ↔ CASAFARI ↔ Brainsre),
  intercambiable tras la misma interfaz.

## Skills

- `valio-feature` (`.claude/skills/valio-feature/`) — implementar features del roadmap
  respetando adapters, motor explicable, RLS multi-tenant y reglas de oro.
- Genéricas de apoyo: senior-fullstack, senior-backend, react-best-practices,
  code-reviewer, test-driven-development.

## Git / cuentas

Cuenta GitHub dedicada **ValioApp** (solo VALIO; también login de Supabase y Vercel).
Repo: **`ValioApp/valio`** (privado, main) — creado y pusheado 2026-07-07. Identidad
por-repo fijada: `ValioApp <301057959+ValioApp@users.noreply.github.com>`. En `gh`:
antes de push la cuenta activa debe ser ValioApp (`gh auth switch --user ValioApp`
si hay varias). gh CLI instalado en `C:\Program Files\GitHub CLI\gh.exe`.
Hosting: **Vercel** (importar `ValioApp/valio`, root directory `app/`) + **Supabase**
(proyecto `valio`, eu-west) — ambos con login GitHub de ValioApp.

## Fase

**Fase 1 — aprobación manual.** En diseño/construcción del MVP: Alex aprueba todo antes
de ejecutarlo. Autonomía para iterar dentro de `app/` y `supabase/` cuando exista el
scaffold, sugiriendo tests en funciones nuevas. Pasará a Fase 2 al acercarse a producción.

## Estado (2026-07-07)

**Plan 1 (fundación + motor) COMPLETADO en código** — 2 revisiones consolidadas APPROVED:
- Motor de valoración puro en `app/src/engine/` (21 tests Vitest verdes): homogeneización
  con 7 ajustes trazables, similitud, mediana ponderada + FSD, regla <6 testigos.
- Migraciones `supabase/migrations/0001-0003` (multi-tenant RLS + PostGIS + RPC radio)
  y `supabase/scripts/seed-dev.sql` — **AÚN SIN APLICAR** (Task 11 manual de Alex).
- App: login magic link, página `/valorar` con testigos/ajustes/disclaimer, persistencia.
  `npm run build` limpio. Deuda registrada en `docs/plans/plan-1-followups.md`.

**Diseño integrado (2026-07-07):** export de Google Stitch en `docs/design/` (sistema
de diseño + 7 pantallas). App restyleada y APPROVED en revisión: tokens Tailwind v4
(paper/petrol/gold, Geist+Inter, tabular-nums), shell sidebar/bottom-nav, login,
formulario de valoración, pantalla de resultado (valor dorado + desglose de ajustes +
testigos), dashboard y cartera con datos reales. Dorado SOLO en cifras de dinero;
texto de dinero en gold-deep #795900 por contraste AA.

**Bloqueado esperando a Alex:**
1. Task 11: crear proyecto Supabase + aplicar migraciones/seed + plantilla email
   Magic Link (checklist en el plan) + `.env.local` → luego smoke test.
2. Nombre: **VALMETRA aceptado como provisional** (2026-07-07), pendiente del OK del
   socio → entonces registrar dominios, crear email + cuenta GitHub, añadirla a `gh`,
   crear repo remoto y renombrar el mundo.
3. Fase 0 comercial: claves APIs del socio (pendientes de que se las pase) + su CSV;
   presupuestos idealista/data, DataVenues, CASAFARI, Brainsre.

**Siguiente:** Plan 2 — ingesta de datos reales (importador CSV socio, ETLs INE/SERPAVI/
Registradores/MIVAU/OpenDataBCN, shapefiles secciones censales, Catastro OVC, geocoding).
