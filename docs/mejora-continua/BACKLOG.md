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
| P6 | 📋 **Informe PDF white-label** con testigos citados y gráficos legibles | F1 — feature más valorada por agencias en toda la evidencia pro | M | **parcial (memorándum print v0 + carrusel de fotos con grid imprimible — Paquete Alex 3/3)** — iteración 8; PDF white-label real → Plan 3 |
| P7 | 📋 **Anti-lead-gen como posicionamiento** (sin teléfono, sin vender leads, pricing público) | Q7 RealAdvisor vende leads >56€ + Q8 Trovimap 2,7/5 | S (copy landing) | **✅ REHECHA editorial (2026-07-08)** — landing "precisión editorial" (Fraunces + tarjeta de producto + motivo cartográfico), micro-trust "sin llamadas de ventas · sin vender tus datos", FAQ lead-gen |
| P8 | 📋 **Estimación de reforma por niveles + escenarios conservador/realista/optimista** | F9+F13 (Invisor la tiene y presume) | M | **✅ iteraciones 5+7** (escenarios + reforma por niveles) |
| P9 | 📋 Histórico y re-valoración periódica de cartera | Q5/Q10 patrón Zestimate | M | backlog |
| P10 | 📋 Análisis desde URL de anuncio + historial del anuncio | F10+F11 — demanda alta pero scraping frágil/riesgo legal (regla de oro nº1) | L | congelado (revisar con APIs del socio) |
| — | Export cartera Excel/CSV | petición típica agencias | S | **✅ iteración 6** |
| P11 | 📋 UX "resultado en <2 min" + free tier 2-3 valoraciones | Estudio Invisor rec.2 — la fricción de entrada es el campo de batalla | S | **avanza: registro self-service real (2026-07-08)** — signup email+contraseña → panel directo (autoconfirm provisional); falta freemium/límite por tier |
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

### Datos reales cargados — 2026-07-07 ✅

Proyecto Supabase operativo (migraciones 0001-0004 aplicadas) y pipeline de zona
real ejecutado contra él (Plan 2.1 Tasks 3-4, adaptadas a la realidad):

- **Renta INE 2023** (`npm run etl:adrh`, `app/scripts/etl-adrh.ts`): 3.646
  secciones de la provincia 08 en `zone_stats` (+3 seeds intactas). El CSV
  vigente del INE trae 40 secciones bajo secreto estadístico (eran 4 en la
  verificación del plan → 3.646 y no 3.682). Raval `0801901001` coef 0.672 ✓.
- **Cartografía censal 2023** (`npm run etl:secciones`,
  `app/scripts/load-census-sections.ts`): 3.642 polígonos en `census_sections`
  vía **WFS 2.0 del INE** (capa `Secciones_2023`, filtro `CPRO='08'` en
  servidor) — sin GDAL: el OGC API Features solo publica el seccionado 2026,
  pero el WFS clásico mantiene las capas anuales. Inserción por lotes con la
  Management API (`st_geomfromgeojson`), idempotente. Excluidos 494 agregados
  `CSEC='000'` (distrito/municipio) que solapaban con las secciones y rompían
  el lookup punto→sección.
- **Verificación**: `census_section_for_point(41.379908, 2.168444)` →
  `0801901019` (Raval, coef 0.594) y `(41.3990, 2.1210)` → `0801905010`
  (Sarrià). Join renta↔geometría: **3.637** secciones con renta Y polígono
  (9 CUSEC del ADRH vigente no existen en la capa WFS 2023 — revisiones
  distintas del propio INE, sin impacto práctico).
- **El buscador de direcciones de `/valorar` queda vivo para la provincia de
  Barcelona**: dirección → CartoCiudad → sección censal PostGIS → coeficiente
  de renta real. Suite 93/93 y `tsc` limpios tras los scripts.

### Paquete Alex 2026-07-08 (3/3): carrusel de fotos ✅

- **Fotos reales del inmueble en el panel de resultado** (banda visual justo tras
  los chips y antes de la card de valor: lo primero que quiere ver quien valora).
  El usuario sube las fotos DESPUÉS de valorar (los inversores fotografían en la
  visita); se asocian a la `property` que la valoración ya crea (`runValuation`
  ahora devuelve su `id` en el estado `done`).
- **Migración 0005** (`property_photos` + RLS de Storage por workspace), aplicada
  en producción vía Management API: tabla `property_photos(property_id, workspace_id,
  storage_path único, sort_order)` con RLS por `auth_workspace_id()`, y policies
  select/insert/delete sobre `storage.objects` del bucket privado `property-photos`
  restringidas a la carpeta `<workspace_id>/` (`storage.foldername(name)[1]`). Ruta
  de los objetos: `<workspace_id>/<property_id>/<uuid>.<ext>`.
- **Data + server actions** (`data/photos.ts`, `valorar/photo-actions.ts`): list con
  URLs firmadas 1 h, upload (auth + workspace + pertenencia de la property + rollback
  del objeto si falla el insert) y delete (fila + objeto). Corren con la sesión del
  usuario, nunca service_role. `validatePhoto` pura (jpeg/png/webp, ≤6 MB) con 3 tests.
- **Componente** `PropertyPhotos.tsx` (client, sin librerías): dropzone con drag&drop
  para el estado vacío y carrusel casero accesible (teclado ←/→, contador, miniaturas,
  añadir más, borrado con confirmación, `useTransition`). Grid imprimible de hasta 3
  fotos sin controles (patrón `print-hidden`). `<img>` con URL firmada (no `next/image`).
- **Fix de raíz**: el límite por defecto de los Server Actions (1 MB) rompía la subida
  de fotos de hasta 6 MB con un error de framework no capturable → `bodySizeLimit: '8mb'`
  + subida por-archivo (un request por foto) con validación previa en cliente.
- **Verificación E2E real** (Playwright contra dev server, sesión magic-link admin):
  "Calle Hospital 92, Barcelona" → sección 0801901019 → 75 m² → Valorar (253.718 €) →
  banda vacía con dropzone → subida de `kitchen.png` (1,3 MB) → carrusel muestra la
  foto (URL firmada, 1376×768) → borrado con confirmación → vuelta al dropzone.
  Verificado en Storage vía service_role: objeto físico presente (1.318.519 B, image/png)
  y luego 0 tras el borrado. `/demo` intacta (sin carrusel, sin persistencia).
- **Verde**: `tsc` limpio, suite **96/96** (93 + 3 de `validatePhoto`), `npm run build`
  limpio. Commits atómicos: migración / data+actions / componente / integración / fix.
- **Queda 2/3 del paquete**: i18n del RESTO de la app (dashboard, valorar, cartera,
  resultado…) en su propio paquete de traducción, que traducirá también los textos
  nuevos del carrusel (hoy en español directo, como el resto de la app).

### Hardening carrusel (post-revisión) 2026-07-08 ✅

Revisión adversarial del carrusel de fotos. La seguridad base ya era sólida; esto es
endurecimiento + una mejora de UX. Aplicado:

1. **Migración 0006** (`0006_photos_hardening.sql`, aplicada en producción vía
   Management API): versiona el bucket `property-photos` como infra-as-code (idempotente,
   sigue `public=false` · 6 MB · jpeg/png/webp) y sustituye la policy `ALL` de
   `property_photos` por policies por-comando; el **INSERT** exige además que
   `storage_path` viva bajo `<workspace_id>/%` (ata la fila de metadatos a la carpeta del
   tenant, replicando en la tabla lo que la RLS de `storage.objects` ya hacía en Storage).
   Verificado en `pg_policies` (4 policies) y bucket privado; 0 filas que migrar.
2. **Bytes mágicos (CWE-434, anti content-type spoofing)** en `data/photos.ts`:
   `sniffPhotoMime` + `validatePhotoBytes` (puras) verifican la firma real (JPEG `FF D8 FF`,
   PNG `89 50 4E 47 0D 0A 1A 0A`, WEBP `RIFF…WEBP`) y su coherencia con el Content-Type
   declarado; el server action valida la cabecera antes de subir. +6 tests (98→102 en el
   total de la suite; 3 nuevos grupos: sniff, spoofing, límites).
3. **Robustez de las server actions** (`photo-actions.ts`): `deletePropertyPhoto` y el
   revert del upload ahora desestructuran el `{ error }` de Storage y lo loguean (antes se
   ignoraba → objeto huérfano sin traza); ambas acciones envueltas en try/catch que
   devuelve `{status:'error'}` (los throws de `listPropertyPhotos` en el re-listado ya no
   caen en silencio); `sort_order` usa `max(sort_order)+1` en vez de `length` (sin colisión
   al re-subir tras borrar una intermedia) y `listPropertyPhotos` desempata por `created_at`.
4. **a11y del carrusel** (`PropertyPhotos.tsx`): región `role="status"` `aria-live="polite"`
   que anuncia "Foto n de N" al cambiar (el contador visual pasa a `aria-hidden`); el overlay
   de confirmación de borrado es `role="dialog"` `aria-modal` con `aria-labelledby`, cierre
   con Escape y foco inicial en Cancelar (salida segura de una acción destructiva).

**Pendiente (no hecho en este paquete):**
- **Refresh de signed-URL antes de imprimir**: las URLs firmadas del carrusel viven 1 h
  (`SIGNED_URL_TTL`); un informe abierto y dejado >1 h imprimiría imágenes caducadas. Re-
  firmar/re-listar en `beforeprint` (o subir el TTL solo para el grid imprimible) → backlog.

Verde: `tsc` limpio, suite **102/102**, `npm run build` limpio.

### Paquete Alex 2026-07-08 (1/3): landing + i18n ✅

- **Landing pública anti-lead-gen (cierra P7)** en `app/src/app/page.tsx` (antes
  redirigía a `/dashboard`): server component fiel al export Stitch
  (`docs/design/landing_page/`) pero adaptado al design system real (paper/petrol/
  gold, hairline, sombras casi nulas, `ValioWordmark`, lucide en vez de Material
  Symbols). Secciones: header (wordmark + switcher + "Entrar"/"Ir al panel" según
  sesión real vía `getUser` server-side → ruta dinámica ƒ), hero con imagen de
  salón de Barcelona, 4 features (renta de zona · ocupación · testigos con cierres
  reales · rentabilidad post-impuestos), banda de 3 fotos de interiores, "Lo que
  los portales no te cuentan", pricing 3 tiers (Starter 49€/25 · Professional
  99€/100 destacado "Más popular" · Agencia 199€/ilimitado) con nota "orientativo ·
  IVA no incluido", FAQ (¿tasación oficial? · zonas · datos · lead-gen) y footer con
  disclaimer legal completo (Orden ECO/805/2003). CTAs → `/login` y `/demo`.
- **i18n es/ca/en con next-intl (sin routing de URL, cookie `VALIO_LOCALE`)**:
  plugin en `next.config.ts`, provider + `lang` dinámico en `layout.tsx`, catálogos
  `landing`+`common` en `src/i18n/messages/{es,ca,en}.json` (catalán central nativo,
  inglés SaaS neutro; disclaimer legal citando ECO/805/2003 en los 3 idiomas) y
  `LanguageSwitcher` (server action `setLocale`) en el header de la landing y en el
  AppShell (sidebar + header móvil).
- **Fotos**: `docs/design/*/screen.png` (bedroom/living/kitchen) copiadas a
  `app/public/landing/`.
- **Verificación**: `tsc` limpio, suite **93/93**, `npm run build` limpio (`/`
  dinámica ƒ). Playwright real contra dev server: screenshots de `/` desktop+móvil
  en ES y cambio de idioma con el switcher a CA ("El preu real…/Prova gratis") y a
  EN ("The real price…/Start free") confirmando que hero, CTAs y header cambian;
  `/login`, `/demo` y `/dashboard` siguen respondiendo (dashboard 307→login sin sesión).
- **Falta 2/3 del paquete**: i18n del RESTO de la app (dashboard, valorar, cartera,
  resultado…) en su propio paquete de traducción. (3/3 carrusel de fotos ✅ hecho —
  ver sección arriba.)

### Producción de datos — 2026-07-07 ✅ SMOKE E2E REAL VERDE
- Supabase `valio` (eu-west-3) creado y migrado 0001-0004 + seed VÍA API (sin dashboard).
- Auth real verificada (magic link flujo `?code=` PKCE adaptado al free tier).
- **Primera valoración real end-to-end**: "Calle Hospital 92, Barcelona" → CartoCiudad
  → sección censal 0801901019 (PostGIS) → coef renta INE 0.594 → prefill Catastro
  (finca 0514310DF3801D) → **275.380 € (3.672 €/m², confianza media, 8 testigos)**
  con ajuste renta de zona −1,5% verificado matemáticamente. Persistida en cartera.
- **Bug de producción cazado y arreglado en el smoke**: `fetchZoneStats` cargaba la
  tabla entera y el límite de 1.000 filas de PostgREST silenciaba zonas (followup nº12
  del Plan 1 hecho realidad) → ahora pide solo las secciones implicadas (commit 3cb4ee8).
- Pendiente: deploy Vercel (Alex) y testigos reales (los 24 actuales son seeds — los
  reales llegan con las APIs/CSV del socio, Plan 2.2).

### Landing editorial + auth email/password 2026-07-08 ✅

Landing genérica reemplazada por la **landing definitiva "precisión editorial"** (dirección
aprobada por Alex) + **registro self-service** con email y contraseña.

- **Fuente Fraunces** (`next/font/google`, variable, óptico) expuesta como `--font-fraunces`
  → token de tema `--font-serif-display` (utilidad `font-serif-display`) para los titulares
  editoriales. Geist sigue como fuente de UI/datos. Metadata orientada a producto.
- **Titular nuevo (cambio de Alex)**: "Cuánto vale. **Y por qué.**" (accent en itálica serif
  gold-deep) · ca "Quant val. I per què." · en "What it's worth. And why."
- **Landing modular** en `app/src/components/landing/*` (server components): `LandingHeader`
  (consciente de sesión vía `getUser`: sin sesión → Iniciar sesión/Crear cuenta; con sesión →
  Ir al panel), `Hero`, `HeroValuationCard`, `ContourMotif`, `TrustStrip`, `PortalesSection`,
  `Features`, `Pricing`, `Faq`, `LandingFooter`. Porta el lenguaje de la maqueta al design
  system real (paper/petrol/gold/hairline, `label-caps`, `tabular-nums`, `shadow-ambient`).
- **ContourMotif** determinista y SSR-safe (`app/src/lib/contour-paths.ts`, sumas de senos con
  armónicos fijos precalculadas — nada de Math.random en render, sin hydration mismatch); la
  animación de trazado es CSS. Un anillo marcado + nodos de cota para lectura de mapa.
- **HeroValuationCard**: réplica de la tarjeta de resultado (275.380 €, 3.672 €/m², confianza
  Media, ajustes renta −18% / ocupación −40% / estado 0%, 14 testigos). Barra de horquilla con
  marcador y banda **derivados de low/value/high reales** (`app/src/lib/range-bar.ts`, puro,
  +5 tests); ubicación en bajo contraste para que el ojo caiga en la cifra; chip que sobresale
  sin tapar contenido.
- **Secciones editoriales** (no 4 cards iguales de IA): franja de datos (3.646 secciones · Renta
  INE 2023 · Catastro · Orden ECO/805/2003), portales 01/02/03 serif, features en filas con
  divisores, pricing 3 tiers (Starter 49 · Professional 99 destacado · Agencia 199, "orientativo
  · IVA no incluido"), FAQ y footer con disclaimer ECO/805/2003. Motion CSS de entrada escalonada
  con `prefers-reduced-motion`. Responsive verificado a 390px sin scroll horizontal.
- **Auth email + contraseña** (mismo lenguaje editorial, `AuthShell`/`AuthField`/`AuthMessage`):
  `/signup` (email+contraseña+workspace opcional → `workspace_name` en `options.data` →
  `handle_new_user`), `/login` reescrito (contraseña primaria + enlace mágico secundario en
  `<details>`), `/forgot` y `/auth/reset`. Zod schemas puros en `app/src/lib/auth-schemas.ts`
  (+6 tests). `app/src/proxy.ts` (middleware→proxy en Next 16) refresca la sesión de Supabase en
  cada request (patrón updateSession de `@supabase/ssr`). Recuperación pasa por `/auth/confirm?next=/auth/reset`
  (un Route Handler sí escribe cookies) para fijar la sesión de recuperación antes del formulario.
- **i18n** ampliado en es/ca/en (namespaces `landing`+`common`+nuevo `auth`); todo el copy vía
  next-intl, nada hardcodeado. Catalán central e inglés SaaS nativos.
- **Config Supabase Auth (Management API)**: `mailer_autoconfirm: true` + `uri_allow_list` de
  localhost. ⚠️ **PROVISIONAL**: autoconfirm hace usable el registro YA sin depender del email
  limitado del free tier. **ANTES DEL LANZAMIENTO PÚBLICO: desactivar `mailer_autoconfirm` y
  conectar Resend/SMTP propio** (va con Stripe, Plan 3). Con autoconfirm off, `/signup` cae al
  estado "revisa tu correo" (ya soportado).
- **Verde**: `tsc` limpio, suite **113/113** (102 + 5 range-bar + 6 auth-schemas), `npm run build`
  limpio (todas las rutas ƒ, Proxy detectado).
- **Verificación real Playwright** (dev server :3000): landing es/ca/en con el switcher (titular y
  secciones cambian, `html lang` correcto, 0 errores de consola, sin scroll horizontal desktop+móvil);
  header conmuta sesión↔sin-sesión; **flujo de cuenta E2E real**: `/signup` con email nuevo →
  **/dashboard** directo (autoconfirm, workspace creado por el trigger); `/login` credenciales
  incorrectas → error legible, correctas → **/dashboard**; `/forgot` → estado "Enlace enviado";
  `/auth/reset` renderiza su formulario. Usuario de prueba borrado vía admin API (verificado).
  Nota honesta: el reset completo (updateUser con sesión de recuperación) no se probó E2E porque
  requiere recibir el email de recuperación (free tier); la UI y el flujo de cookies quedan listos.
  Supabase rechaza el TLD `.local` en `resetPasswordForEmail` (solo afecta a emails de prueba).

### Ajuste landing: ejemplo Eixample + fotos Barcelona reales 2026-07-08 ✅

Feedback directo de Alex sobre la landing editorial.

- **Ejemplo del héroe → Dreta de l'Eixample** (familia clase media-alta, ni Raval ni
  casoplón): `HeroValuationCard` pasa de El Raval (275.380 € · clase baja · ajustes
  negativos) a **525.000 € · 5.050 €/m² · 104 m² · horquilla 498k–552k · confianza
  Alta · 18 testigos**. El desglose "por qué" ahora es **positivo** para lucir la
  ventaja de VALIO (el factor de zona): renta l'Eixample **+14%**, estado reformado
  **+8%**, planta y ascensor **+3%**, en color `success` en vez del rojo de penalización.
  Barra de horquilla recalculada por `range-bar.ts` (marcador al 50 %). i18n es/ca/en
  (location, confidence, rows zone/condition/floor). `/demo` intacta (datos seed reales).
- **Banda "Barcelona real"** (`BarrioStrip.tsx`, tras Features): 6 fotos reales de
  Unsplash (Unsplash License, uso comercial sin atribución) curadas ESTRICTAS —
  fachadas del Eixample (chaflán modernista, balcones de forja), tejados de Barcelona
  con Montjuïc/Palau Nacional y Sagrada Família al fondo, rambla de barrio con
  plátanos, retícula aérea del Eixample. Descartadas playa/casoplones/interiores
  genéricos. Mosaico sobrio (grid 2/3 col, `aspect-[4/5]`, `object-cover`, hairline,
  radio 12px, `loading="lazy"`, alt descriptivo es/ca/en). Descargadas optimizadas
  (`w=1280 q=70`, ~2,1 MB las 6) a `app/public/landing/` + `CREDITS.md` con origen y
  licencia. Retiradas las 3 PNG IA huérfanas previas (bedroom/kitchen/living, sin uso
  ni licencia; una parecía Nueva York, otra cocina genérica US).
- **Verde**: `tsc` limpio, suite **113/113**, `npm run build` limpio. Verificación
  Playwright (dev :3000, DOM — los PNG de captura no persisten en este entorno):
  tarjeta del héroe con "Dreta de l'Eixample" · 525.000 € · Confianza Alta · +14/+8/+3 %;
  las 6 fotos cargan (1280×… natural) con su `alt`; grid a 2 col en móvil (390px) sin
  scroll horizontal; 0 errores de consola.
