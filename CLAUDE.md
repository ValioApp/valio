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

## Git

Repo previsto: cuenta **Sekees** (`Sekees/valio`) — como OFISAT, es la cuenta con push
operativo hoy; identidad global vale. Mientras no exista el repo propio, el mundo se
respalda en el repo paraguas `Sekees/universo`. Cuando se cree el repo propio: añadirlo
a `MANIFIESTO-REPOS.md` y excluir la carpeta en el `.gitignore` del paraguas.

## Fase

**Fase 1 — aprobación manual.** En diseño/construcción del MVP: Alex aprueba todo antes
de ejecutarlo. Autonomía para iterar dentro de `app/` y `supabase/` cuando exista el
scaffold, sugiriendo tests en funciones nuevas. Pasará a Fase 2 al acercarse a producción.

## Estado (2026-07-06)

Diseño aprobado (spec en docs/). Pendiente: plan de implementación → scaffold de la app.
**Fase 0 de Alex (en paralelo):** pedir al socio claves de APIs + su CSV; pedir
presupuesto a idealista/data, DataVenues, CASAFARI y Brainsre.
