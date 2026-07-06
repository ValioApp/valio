# Prompt para Google Stitch — Front-end de VALIO

> Uso: pegar el **prompt maestro** al crear el proyecto en Stitch, y luego generar
> pantalla a pantalla con los **prompts por pantalla** (Stitch trabaja mejor así).
> El nombre "VALIO" es provisional: sustituirlo por la marca final en cuanto se decida.
> Los textos de UI van en español tal cual aparecen aquí.

---

## Prompt maestro (contexto de diseño — pegar primero)

```
Design a professional Spanish proptech SaaS web app called "VALIO" — an automated
property valuation tool for real estate investors and agencies in Spain. Users value
apartments and houses and get: estimated value, price range, confidence level, the
comparable properties used ("testigos"), and an explainable breakdown of adjustments —
including the signature feature: "Ajuste por renta de la zona: +18%" (income-based
neighborhood adjustment) and "Ajuste por ocupación: -40%" (occupied property discount).

BRAND PERSONALITY: data-driven, trustworthy, precise. Think Linear meets Stripe
Dashboard meets a modern fintech — NOT a consumer real estate portal. Premium,
analytical, calm. Spanish UI copy throughout (es-ES), currency in EUR with Spanish
formatting (280.000 €).

VISUAL SYSTEM:
- Light theme base: warm off-white background (#FAFAF7), ink text (#101828).
- Primary accent: deep petrol blue (#0F4C5C) for navigation and actions.
- The VALUE and money figures use a distinctive amber/gold (#D4A017) — money = gold.
- Confidence states: high = emerald, medium = amber, low = terracotta.
- Typography: Inter or Geist; large tabular numerals for prices; generous whitespace.
- Cards with 12px radius, hairline borders (#E5E5E0), very subtle shadows.
- Data-viz style: thin lines, dot markers, no heavy gradients. Maps in muted grayscale
  with petrol-blue pins for the subject and small gold dots for comparables.
- Every screen that shows a value MUST include a small amber notice at the bottom:
  "Valoración orientativa. No sustituye la tasación oficial (Orden ECO/805/2003)."

LAYOUT: left sidebar navigation (icons + labels): Dashboard, Valorar, Cartera,
Informes, Datos, Ajustes. Top bar with workspace switcher and user avatar.
Responsive, desktop-first but mobile-friendly.
```

## Pantalla 1 — Dashboard

```
Dashboard screen for VALIO. Header "Buenos días, Alex" with workspace name "Inversiones
Baix SL". Four stat tiles: "Valoraciones este mes: 47 / 100", "Valor medio: 286.400 €",
"Confianza media: Alta", "Zonas activas: Barcelona + Àrea Metropolitana". Below: a
two-column layout. Left: "Últimas valoraciones" table with columns Dirección, Tipo,
Valor (gold figures), Confianza (colored pill: Alta/Media/Baja), Fecha. Right: a card
"Mapa de actividad" showing a grayscale map of Barcelona with gold dots. Bottom-left
card: "Calidad del motor" with two small metrics "MdAPE 7,2%" and "PPE10 74%" and a
sparkline. Include the amber legal notice at the bottom.
```

## Pantalla 2 — Nueva valoración (formulario)

```
"Valorar inmueble" screen. A clean two-step form card, step 1 of 2 active:
"1. Localización" with a large address search input ("Calle, número, municipio…"),
below it a muted grayscale map preview with a draggable petrol pin, and a small note
"Detectamos automáticamente la sección censal y los datos del Catastro".
Step 2 preview grayed: "2. Características". Right side panel: "Datos del Catastro"
card auto-filled (Superficie: 78 m², Año: 1965, Uso: Residencial) with an "Editar"
link. Characteristics fields as elegant segmented controls and inputs: Tipo
(Piso/Casa), m² construidos, Habitaciones, Planta, Ascensor (toggle), Año, Estado
(A reformar / Buen estado / Reformado / Obra nueva), Ocupación (Libre / Alquilado /
Ocupado — this one highlighted with a small info tooltip "Un inmueble ocupado cotiza
con fuerte descuento"). Big primary button "Valorar inmueble".
```

## Pantalla 3 — Resultado de valoración (la pantalla estrella)

```
Valuation result screen — the hero screen of VALIO. Top: address "C/ Hospital 92, 3º-2ª
— El Raval, Barcelona" with a "Piso · 75 m² · 3 hab · Ocupado" subtitle chip row.
Center hero: huge gold figure "196.000 €" with range bar underneath showing
"178.000 € ——◆—— 214.000 €" and a confidence badge "Confianza: Media" (amber pill).
Below the hero, THE differentiator — a card "Por qué este valor" with a horizontal
waterfall/breakdown: "Base comparables: 3.680 €/m²" then adjustment rows with signed
colored values: "Ajuste por renta de la zona (El Raval): −22%", "Ajuste por ocupación:
−40%", "Estado (buen estado): 0%", each with a small info icon. Right column:
"12 testigos utilizados" — a compact list of comparable cards (m², distance "a 240 m",
€/m² ajustado in gold, source tag "cierre" in emerald or "anuncio" in gray) above a
small map with the subject pin and comparable dots. Action buttons top-right:
"Descargar informe PDF" (primary) and "Guardar en cartera". Amber legal notice at
the bottom.
```

## Pantalla 4 — Cartera

```
"Cartera" screen: portfolio of valued properties. Filter bar (Municipio, Tipo,
Confianza, Fecha). A refined data table: Dirección, Zona, Tipo, m², Valor estimado
(gold), Horquilla, Confianza pill, "Valor vs precio pedido" column showing signed
percentages (green negative = opportunity, e.g. "−12% vs anuncio"), row menu.
One row selected showing a slide-over panel with the mini valuation summary and a
"Revalorar" button. Empty-state design hint: "Importa la cartera de tu agencia o
valora tu primer inmueble" with two buttons "Importar CSV/Excel" and "Valorar".
```

## Pantalla 5 — Importador de datos del socio

```
"Datos" screen, import wizard step 2 of 3: "Mapear columnas". Left: preview table of
an uploaded Excel (first 5 rows, Spanish real estate data). Right: mapping card —
each detected column with a dropdown to map to VALIO fields (Dirección, Precio de
cierre, m², Habitaciones, Estado de ocupación, Fecha de operación…). Green checks on
auto-mapped columns, one amber warning "No detectamos la columna de ocupación —
selecciónala o márcala como no disponible". Info banner: "Los datos se anonimizan:
solo guardamos inmueble, precio y fecha". Footer: "23 filas listas · 2 con avisos"
and buttons "Atrás" / "Importar 23 comparables".
```

## Pantalla 6 — Landing pública con pricing

```
Public marketing landing page for VALIO (same brand system, slightly more expressive).
Hero: headline "El precio real de cualquier inmueble. Con el porqué." subheadline
"Valoración orientativa con testigos reales, ajuste por zona y ocupación. Para
inversores y agencias." CTA "Prueba 14 días gratis" + secondary "Ver una valoración
de ejemplo". Right side: a floating screenshot of the valuation result screen.
Section "Lo que los portales no te cuentan" with 3 feature cards: "Factor zona
explicable", "Descuento por ocupación", "Tus propios cierres como testigos".
Pricing section with 3 transparent tiers in cards: Starter 49 €/mes (25 valoraciones),
Professional 99 €/mes (100 valoraciones, informes con tu marca), Agencia 199 €/mes
(ilimitado, importación de cartera, API) — middle tier highlighted "Más popular".
FAQ accordion and a final legal strip: "VALIO emite valoraciones orientativas; no es
una sociedad de tasación homologada".
```
