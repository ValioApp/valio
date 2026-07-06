# VALIO — Diseño del producto (spec)

> **Fecha:** 2026-07-06 · **Estado:** aprobado por Alex · **Base:** brainstorming guiado +
> investigación de mercado verificada (ver `2026-07-06-informe-mercado.md`).

---

## 1. Qué es

SaaS multi-tenant de **valoración orientativa de inmuebles** para España. El usuario
introduce una dirección o referencia catastral + características del inmueble y recibe:

- **Valor estimado + horquilla + nivel de confianza** (nunca cifra única sin contexto).
- **Testigos comparables** usados (mínimo 6, objetivo 10–20) con sus ajustes de
  homogeneización desglosados.
- **Factor zona explícito**: línea tipo *"ajuste por renta de la zona: +18%"* calculada
  con la renta por sección censal del INE. Es el diferenciador nº1 (resuelve el
  "Raval vs Sarrià" que los portales no ponderan).
- **Ajuste por estado de ocupación** (ocupado/desocupado) — diferenciador nº2, un piso
  ocupado se vende con descuentos del 30–50% y ningún valorador lo pondera.
- **Informe PDF white-label** con logo del cliente y disclaimer legal.

**Posicionamiento en una frase:** la única herramienta con precios públicos que fusiona
los datos propios del cliente con datos oficiales y explica cuánto pesa el barrio en el
precio — orientativa por diseño, con derivación a tasadora homologada cuando haga falta.

## 2. Decisiones tomadas (con Alex, 2026-07-06)

| Decisión | Elección |
|---|---|
| Usuario v1 | **SaaS comercial desde el día 1** (multi-tenant, Stripe, landing con pricing público) |
| Tipologías MVP | **Residencial (pisos y casas)**; naves industriales/polígonos en v1.5 (hueco confirmado sin competencia) |
| Geografía | **Barcelona + área metropolitana**, arquitectura preparada para activar zonas (Cataluña → España) |
| Clientes | Escalera: MVP → **inversores + agencias**; particulares (freemium/lead-magnet) y profesionales del crédito (API) después |
| Nombre | **VALIO** (nombre de trabajo; branding revisable) |
| Estrategia de datos | **Plan A**: MVP con datos 100% gratuitos + CSV del socio; las **claves de API del socio (Idealista, Fotocasa…)** se enchufan como adapters cuando las facilite; agregador de pago (idealista/data, DataVenues, CASAFARI, Brainsre) en Fase 2 |

## 3. Stack

- **Next.js 16 (App Router) + TypeScript estricto + Tailwind + shadcn/ui** — mismo patrón
  que `crm-ai-native` (reutilizar convenciones probadas: multi-tenant por workspace,
  RBAC, Stripe, audit log).
- **Supabase**: Postgres + **PostGIS** (pieza nueva: secciones censales, búsqueda de
  comparables por radio), Auth, RLS en todas las tablas, Storage (PDFs).
- **Stripe**: 3 tiers (orientativo 49/99/199 €/mes) con cupo de valoraciones/mes,
  trial 14 días, Customer Portal.
- **n8n** (instancia OBX): ETLs batch programados de datos públicos.
- Motor ML futuro (v2): servicio Python LightGBM en contenedor (VPS/EasyPanel); la
  interfaz del motor lo contempla desde v1.

## 4. Arquitectura (4 piezas)

### 4.1 Ingesta por adapters
Interfaz única `ComparableSource`; cada fuente es un adapter enchufable e independiente:

| Adapter | Tipo | Estado MVP |
|---|---|---|
| Importador socio (CSV/XLSX, mapeo de columnas asistido) | manual | ✅ MVP — sus **cierres reales** son la fuente de máxima fiabilidad; incluye estado de ocupación |
| Catastro OVC (`Consulta_DNPRC`) | tiempo real + caché | ✅ MVP — superficie, año, uso; gratis, sin key |
| INE Atlas de Renta (sección censal) | ETL anual | ✅ MVP |
| SERPAVI (alquiler por sección censal) | ETL anual, descarga semi-manual (WAF) | ✅ MVP |
| Registradores (cierres por provincia) | ETL trimestral, semi-manual (WAF) | ✅ MVP — **solo capa de calibración agregada** (licencia ODbL share-alike) |
| MIVAU valor tasado (municipio) | ETL trimestral, semi-manual | ✅ MVP |
| Open Data BCN (barrio) | ETL (API CKAN) | ✅ MVP |
| API Idealista (claves del socio) | API | 🔌 se activa al recibir claves |
| Otras APIs del socio (Fotocasa/…) | API/feed | 🔌 se activa al recibir claves |
| Agregador de pago (idealista/data ↔ DataVenues ↔ CASAFARI ↔ Brainsre) | API | Fase 2 — intercambiable sin tocar el motor |

**Prohibido:** scraping de portales en el pipeline de producción (ToS + doctrina
Ryanair + derecho sui generis de BD = demandable).

### 4.2 Pipeline de zona
Geocodificación (CartoCiudad/Nominatim) → sección censal (shapefiles INE cargados en
PostGIS) → tabla `zone_stats` precalculada: coeficiente de renta (renta sección ÷ renta
municipio), rangos de alquiler, calibración por barrio/municipio/provincia. Batch; solo
Catastro va en tiempo real.

### 4.3 Motor de valoración v1 (sin ML, explicable)
Comparables ajustados ("appraisal emulation"):
1. Buscar testigos por radio + similitud (tipología, superficie ±%, antigüedad…).
2. Homogeneizar con coeficientes: superficie, planta/ascensor, estado de conservación,
   antigüedad, **ocupación**, y ajuste oferta→cierre **por zona y días en mercado**
   (media ~6%, rango 1–15%; nunca % fijo) cuando el testigo sea un anuncio.
3. Aplicar factor zona (coeficiente de renta de sección censal) de forma explícita.
4. Sintetizar: mediana ponderada por similitud → valor + horquilla + confidence score
   (función del nº y calidad de testigos, tipo FSD).
5. **Con <6 testigos: rehusar valorar** (o degradar a "orientación de zona"). Mejor no
   valorar que valorar mal.

Los ajustes son **funciones puras** (testeables con Vitest). La interfaz
`ValuationEngine` admite implementación ML (LightGBM) en v2 sin cambiar el producto.

### 4.4 Capa SaaS
Workspaces multi-tenant con RLS (patrón crm-ai-native), roles, onboarding wizard,
billing Stripe, landing pública con pricing (diferenciador de mercado: TODOS los
competidores esconden precios), audit log, i18n-ready (ES primero).

## 5. Modelo de datos (núcleo)

- `workspaces`, `members` — multi-tenancy + RBAC.
- `properties` — inmueble a valorar (datos del usuario + enriquecimiento Catastro).
- `valuations` — resultado versionado: valor, horquilla, confidence, testigos usados y
  ajustes aplicados (JSONB), snapshot reproducible.
- `comparables` — fuente, geometría (PostGIS), atributos, precio, fecha,
  `is_closing_price`, `occupancy_status`.
- `zone_stats` — features por sección censal.
- `imports` — batches de datos del socio (trazabilidad).
- `data_sources` — adapters configurados por workspace; credenciales en vault/secrets,
  jamás en tabla plana.

Todas las tablas: `id` uuid, `created_at`, `updated_at`, RLS activado. RGPD: ingesta del
CSV del socio **anonimizada** (inmueble + precio + fecha; sin partes de la operación).

## 6. Calidad y legal

- **Backtesting MdAPE / PPE10** out-of-time contra precios de cierre (nunca contra
  anuncios). Objetivo realista: MdAPE 5–9% en pisos urbanos. Publicarlo = argumento de venta.
- **Legal**: siempre "valoración orientativa"; jamás "tasación" (la tasación oficial
  exige sociedad homologada Banco de España — ECO/805/2003 y Orden ECM/599/2025).
  Disclaimer visible en cada informe. Upsell futuro: convenio con tasadora homologada.
- **Tests**: Vitest (motor: funciones puras de ajuste), Playwright (flujo E2E valorar →
  informe), seeds sintéticos + muestra del socio.

## 7. Alcance MVP (resumen ejecutable)

1. Auth + workspaces + onboarding (patrón CRM).
2. Importador CSV/XLSX del socio con mapeo asistido.
3. ETLs de zona (INE, SERPAVI, Registradores, MIVAU, Open Data BCN) + carga shapefiles.
4. Enriquecimiento Catastro con caché.
5. Motor v1 comparables ajustados + factor zona + ocupación.
6. UI de valoración + detalle de testigos + informe PDF white-label con disclaimer.
7. Stripe 3 tiers + landing con pricing público.

**Fase 0 (Alex, en paralelo, no bloquea):** pedir al socio las claves de las APIs y su
CSV; pedir presupuesto a idealista/data, DataVenues, CASAFARI y Brainsre.

**v1.5:** módulo naves industriales (3 métodos reconciliados: comparables asistidos +
capitalización de rentas + coste de reposición; contexto de polígono con SIPAE y Naus i
Solars del AMB; horquilla amplia siempre). **v2:** motor ML, computer vision de fotos,
API pública para profesionales del crédito, freemium particulares.

## 8. Qué NO hace el MVP

Scraping en producción · naves con cifra única · lenguaje de "tasación" · computer
vision · cobertura nacional de industrial · integración de agregador de pago (Fase 2).

## 9. Riesgos aceptados

- Pocos testigos al inicio (dependemos de la cartera del socio) → mitigado con rehusar
  valorar + fase 0 comercial.
- Descargas semi-manuales (WAF en MIVAU/Registradores) → documentar proceso trimestral.
- Las claves del socio pueden tardar → el MVP no depende de ellas.
