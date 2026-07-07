# Mejora continua VALIO — backlog y bitácora del loop

> Loop de automejora pedido por Alex (2026-07-07): investigar quejas de usuarios y
> gaps de la competencia → priorizar aquí → implementar con TDD y revisión → commit
> local → registrar. Condición de parada: SaaS claramente superior en features útiles.
> Reglas: nunca romper las reglas de oro del CLAUDE.md; lo del socio → placeholder +
> PENDIENTES-SOCIO.md; producción/deploy siempre con aprobación de Alex (Fase 1).

## Backlog priorizado (v2 — con investigación de quejas reales 2026-07-07)

Fuente: investigación de reseñas/foros verificada (informe completo en
`docs/mejora-continua/2026-07-07-investigacion-quejas.md`). 🛡️ = difícil de copiar.

| P | Feature | Señal (queja/petición) | Esfuerzo | Estado |
|---|---|---|---|---|
| P1 | 🛡️ **Confianza explicada + rango honesto** ("por qué media y no alta: 8 testigos, dispersión 3,6%") | Q4 black-box (Reddit alto karma) + Q6 saltos sin explicación + Q13 zonas finas | S | **✅ iteración 1** |
| P2 | 📋 **Módulo rentabilidad inversor post-impuestos**: yield neto, cash-flow con hipoteca, ITP por CCAA, notaría/registro, IRPF reducciones 50/60/70/90%, vacancia por defecto | F3+F4+F5 (evidencia ALTA: Rankia, Forohipotecario; "Casafari no calcula rentabilidad neta ni cash-flow") | M | **✅ iteración 2** |
| P3 | 🛡️ **Doble precio: valor de anuncio vs valor de cierre estimado** con diferencial por zona | Q1 dispersión 3x entre valoradores + Q2 precios inflados 10-20% (test empírico HelpMyCash) | M | backlog (necesita calibración Registradores — Plan 2.3) |
| P4 | 🛡️ **Ocupación como titular del informe** (% sobre valor de mercado, regla inversor 60-70%) | F12; ninguna herramienta reseñada lo cubre; VALIO ya calcula el ajuste | S | **✅ iteración 3** |
| P5 | 🛡️ **Alquiler estimado + flag zona tensionada** por sección censal | F6 (idealista lo cobra B2B) + F8; encaja con pipeline INE/SERPAVI | M | backlog (tras Plan 2.1 completo) |
| P6 | 📋 **Informe PDF white-label** con testigos citados y gráficos legibles | F1 — feature más valorada por agencias en toda la evidencia pro | M | **parcial (memorándum print v0)** — iteración 8; PDF white-label real → Plan 3 |
| P7 | 📋 **Anti-lead-gen como posicionamiento** (sin teléfono, sin vender leads, pricing público) | Q7 RealAdvisor vende leads >56€ + Q8 Trovimap 2,7/5 | S (copy landing) | backlog (Plan 3) |
| P8 | 📋 **Estimación de reforma por niveles + escenarios conservador/realista/optimista** | F9+F13 (Invisor la tiene y presume) | M | **✅ iteraciones 5+7** (escenarios + reforma por niveles) |
| P9 | 📋 Histórico y re-valoración periódica de cartera | Q5/Q10 patrón Zestimate | M | backlog |
| P10 | 📋 Análisis desde URL de anuncio + historial del anuncio | F10+F11 — demanda alta pero scraping frágil/riesgo legal (regla de oro nº1) | L | congelado (revisar con APIs del socio) |
| — | Export cartera Excel/CSV | petición típica agencias | S | **✅ iteración 6** |
| P11 | 📋 UX "resultado en <2 min" + free tier 2-3 valoraciones | Estudio Invisor rec.2 — la fricción de entrada es el campo de batalla | S | **parcial (falta freemium)** — iteración 4 |
| P12 | 📋 SEO comparativo: /vs/invisor, /vs/cassandra, /vs/lystos, /comparativa | Estudio Invisor rec.3 — gana esas búsquedas sin competencia hoy | S | backlog (Plan 3 landing) |
| P13 | 📋 "Memorándum de inversión" white-label como formato del PDF | Estudio Invisor rec.4 — ellos lo venden premium sin trazabilidad real | M | **parcial (memorándum print v0)** — iteración 8; PDF white-label real → Plan 3 |
| P14 | 🛡️ Publicar precisión (MdAPE/PPE10) + página "por qué a veces rehusamos valorar" | Estudio Invisor rec.5 — nadie del segmento publica métricas de error | S | backlog (necesita backtesting con cierres) |

⚠️ Competidor más cercano: **Invisor** (invisor.es) — estudio completo en
`2026-07-07-competidor-invisor.md`. Responde "¿qué compro?"; VALIO responde "¿cuánto
vale de verdad y por qué?". Su talón de Aquiles: pipeline de scraping sin acuerdos.

## Iteraciones

### Iteración 1 — 2026-07-07 ✅
- Infraestructura del loop creada (este archivo + PENDIENTES-SOCIO.md).
- Investigación de quejas/reseñas completada y archivada
  (`2026-07-07-investigacion-quejas.md`): 14 quejas documentadas, 15 features
  pedidas, top-10 oportunidades. Backlog repriorizado (v2, arriba).
- **Implementado P1 — Confianza explicada**: `lib/confidence.ts` (+5 tests) y
  sección "Por qué esta confianza" en la card de valor (testigos, cierres reales,
  dispersión, y qué faltaría para subir de nivel; aviso de horquilla amplia en
  confianza baja). Suite 48/48. Fix de alias `@/` en vitest.config.
- Visible en `/demo` (el motor real ya lo alimenta).

### Iteración 2 — 2026-07-07 ✅
- **Implementado P2 — Rentabilidad inversor post-impuestos**: `engine/rentability.ts`
  + `rentability-rates.ts` (tasas v0 documentadas, VERIFICAR antes de producción;
  +19 tests TDD) y `RentabilityCard` interactiva en la pantalla de resultado:
  yield bruto/neto/post-impuestos, cash-flow con hipoteca francesa, ITP por CCAA
  (o IVA+AJD obra nueva), IRPF con reducciones 50/60/70/90% y vacancia 5% por
  defecto, con desglose línea a línea trazable. Suite 67/67, build limpio.
- Pendiente conocido: alquiler mensual es input manual hasta SERPAVI (P5).

### Iteración 3 — 2026-07-07 ✅
- Estudio del competidor más cercano (**Invisor**) archivado
  (`2026-07-07-competidor-invisor.md`); backlog ampliado con P11-P14.
- **Implementado P4 — Análisis de compra ocupada**: `lib/occupancy.ts` (+5 tests)
  y card destacada en el resultado cuando hay ajuste de ocupación: valor
  equivalente libre, % sobre valor libre, y veredicto contra la regla del
  inversor distressed (comprar ≤70% del libre). Suite 72/72, build limpio.
- P2 también marcado ✅ (iteración 2, commits ff7ffcb/01a1bee/999e47a).

### Iteración 4 — 2026-07-07 ✅
- **Implementado Plan 2.1 Tasks 7-8 (P11 parcial — UX de entrada)**: server actions
  de resolución (`valorar/resolve-actions.ts`: CartoCiudad find → RPC PostGIS →
  zone_stats → Catastro con caché) y `/valorar` real con autocomplete (debounce
  300 ms), card "Datos del Catastro" editable, hidden lat/lon/censusSectionId y
  gating de submit por zona activa. Degradación sin Supabase: aviso claro que
  remite a Task 11 + /demo (desviación documentada). Suite 72/72, build limpio.
- Falta para cerrar P11: free tier 2-3 valoraciones (freemium → Plan 3) y runtime
  real (Task 11 Plan 1 + migración 0004 + ETL, en manos de Alex).

### Iteración 5 — 2026-07-07 ✅
- **Implementado P8-lite — Escenarios conservador/realista/optimista**:
  `engine/scenarios.ts` (+6 tests TDD) ajusta renta/vacancia/tipo de hipoteca sobre
  el mismo escenario de compra (conservador −10% renta/8% vacancia/+0,5pp; optimista
  +5% renta/3% vacancia/−0,25pp con suelo 0) y llama a `computeRentability` puro; el
  realista es idéntico al caso base (aserción deep-equal en test). Fila de 3 mini-tiles
  bajo el resultado de `RentabilityCard` con cash-flow y rentabilidad neta por escenario.
  Suite 78/78, `tsc` y build limpios.
- Falta para cerrar P8 completo: estimación de reforma por niveles.

### Iteración 6 — 2026-07-07 ✅
- **Implementado Export cartera Excel/CSV**: `lib/csv.ts` (builder puro `buildCsv`
  con BOM UTF-8, separador ';', CRLF y escapado; `buildCarteraCsv` sobre
  `ValuationRow`, +7 tests TDD) y ruta `GET /cartera/export` (auth, 401 sin
  sesión, `Content-Disposition: attachment`) con botón "Exportar CSV" en la
  cartera (visible solo con filas). Suite 85/85, `tsc` y build limpios (la
  ruta sale dinámica ƒ).
- Runtime sin verificar en vivo: sin Supabase configurado (Task 11 pendiente
  de Alex) la ruta devolvería error hasta que exista sesión real.

### Iteración 7 — 2026-07-07 ✅
- **Implementado P8 (cierre) — Estimación de reforma por niveles**:
  `engine/renovation.ts` (`estimateRenovation(level, builtAreaM2)`, tarifas v0
  €/m² por nivel ninguna/lavado/parcial/integral/premium, redondeo a la centena,
  +5 tests TDD) y select de nivel en `RentabilityCard` que autorrellena el
  importe de reforma (editable) al cambiar de nivel; `ValuationResult` pasa
  `subject?.builtAreaM2` como nueva prop opcional. Sin superficie disponible el
  autorrelleno usa 0 y manda el importe editado a mano. Suite 90/90, `tsc` y
  build limpios.
- P8 queda completo (escenarios de iteración 5 + reforma por niveles).

### Iteración 8 — 2026-07-07 ✅
- **Implementado P6/P13-lite — Memorándum de valoración imprimible (v0, print
  CSS del navegador, sin librerías PDF)**: bloque `@media print` en
  `globals.css` (`.print-hidden` oculta sidebar/header/bottom-nav de
  `AppShell` y el formulario de `/valorar`; fondo blanco puro, sin sombras);
  `ReportHeader.tsx` (cabecera solo-impresión con wordmark, título, fecha
  formateada en cliente vía `formatReportDate` — +3 tests — y chips del
  inmueble si hay subject, con pie de disclaimer breve); `PrintButton.tsx`
  (client component aparte con `window.print()`, para que `ValuationResult`
  siga siendo server-compatible); y en `RentabilityCard`, listeners
  `beforeprint`/`afterprint` que fuerzan el atributo `open` nativo del
  `<details>` del desglose — Chromium usa `content-visibility: hidden` en un
  pseudo-elemento interno para el contenido cerrado, que un simple `display`
  en CSS no revierte de forma fiable (detectado y corregido durante la
  verificación visual, no solo confiado a la propuesta inicial). Suite
  93/93, `tsc` y build limpios.
- **Verificación visual real con Playwright** contra el dev server: captura
  en pantalla de `/demo` y `/valorar` (botón "Imprimir informe" visible junto
  al valor, nada roto, consola sin errores) y captura en `media: 'print'`
  con `beforeprint` disparado manualmente — confirma cabecera/disclaimer
  visibles, chrome de la app oculto, y el desglose de rentabilidad (`ITP`,
  notaría/registro…) impreso abierto sin el toggle "Ver desglose".
- Queda pendiente para un PDF white-label real (numeración de página,
  gráficos, marca de agua/logo de agencia, envío por email): Plan 3.

### Checkpoint del loop — 2026-07-07
- **Backlog local ejecutable AGOTADO tras 8 iteraciones**: P1✅ P2✅ P4✅ P8✅
  P11-parcial✅ export✅ P6/P13-parcial✅ (P3, P5, P7, P9, P10, P12, P14 no
  tienen más recorrido sin datos/activos externos).
- Lo que queda requiere una de tres cosas:
  1. **Task 11 de Alex** (Supabase): aplicar migraciones/seed, `.env.local`,
     smoke test — desbloquea el pipeline de datos reales para P3 (doble
     precio), P5 (alquiler por zona), P14 (precisión publicable) y los ETLs
     del Plan 2.1.
  2. **Plan 3** (landing/PDF/freemium/SEO): P6/P13 (PDF white-label real sobre
     la base del memorándum print v0), P7 (posicionamiento anti-lead-gen en
     landing), P12 (SEO comparativo /vs/).
  3. **Al socio**: P10 (análisis desde URL, congelado por riesgo legal de
     scraping — regla de oro nº1) y calibración de tarifas/tasas con sus datos
     reales (idealista/data, CSV de cierres).
- **Estado del producto local**: la pantalla de resultado, el análisis de
  inversión (rentabilidad post-impuestos, escenarios, ocupación, reforma por
  niveles, confianza explicada) y ahora el memorándum imprimible están
  objetivamente por delante de todo lo reseñado del segmento (Invisor
  incluido). Falta el pipeline de datos reales para poder reclamarlo
  públicamente — sin eso, todo es v0 con tasas documentadas pero sin calibrar
  contra cierres reales.
- **Fase local COMPLETADA con 8 iteraciones.** Loop en pausa hasta
  desbloqueo (Task 11 de Alex / OK del socio a nombre / Plan 3).
