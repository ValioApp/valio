# Informe competitivo: Invisor vs VALIO

Verificado 2026-07-07 con fetches directos a invisor.es. Sesgo: fuente principal es el propio sitio de Invisor.

## Ficha Invisor (invisor.es)

- **Qué es**: sourcing + análisis de rentabilidad para inversores ("Te dice qué comprar, por qué y cuánto vas a ganar"). **NO es un valorador** — no da valor de mercado con horquilla/confianza.
- **Producto**: scouting automático de 6 portales (Idealista, Fotocasa, Habitaclia, pisos.com, Milanuncios, Wallapop) cada 2-8h con deduplicación; scoring IA 0-100 personalizado por tesis de inversión (4 estrategias); P&L automático (TIR, ROI, Cash-on-Cash, NOI, Cap Rate, alquiler estimado); reforma estimada por fotos en 5 niveles; análisis por URL en ~2 min (3 gratis); copiloto IA; memorándums de inversión exportables. Datos: Catastro, INE (demografía), ArcGIS, comparables **de anuncio** (sin cierres).
- **Pricing público sin permanencia** (verificado): Starter 49€ (500 inmuebles/mes), Pro 149€ (1.500), Max 349€ (4.000); exceso a céntimos en vez de bloquear; trial 149€/30 días.
- **Fortalezas a aprender**: pricing self-service; UX "pega URL → 2 min"; scoring por tesis; overage a céntimos; **máquina SEO** de páginas /vs/cassandra, /vs/lystos, /vs/casafari que captura todas las búsquedas del nicho.
- **Debilidades**: riesgo legal estructural (vive de rastrear 6 portales sin acuerdos declarados — justo lo que nuestra regla de oro prohíbe; si Idealista bloquea, mueren); no valora (scoring ≠ valor de mercado); comparables de anuncio sin cierre; cero validación pública de precisión; cero reseñas independientes; producto muy joven.

## VALIO vs Invisor (honesta)

Ganamos en: valoración con horquilla+confianza explicada, factor renta INE por sección censal, ajuste por ocupación, testigos trazables con cierres, desglose de ajustes, naves (v1.5), pipeline 100% legal, PDF white-label (spec).
Ellos ganan en: sourcing/alertas de oportunidades, P&L inversor (→ **iteración 2 lo cierra**), reforma por fotos, copiloto IA, scoring por tesis, deduplicación multi-portal.
Empatamos en pricing público (49/149/349 ellos vs 49/99/199 orientativo nuestro).

**Lectura estratégica**: Invisor responde "¿qué compro?"; VALIO responde "¿cuánto vale de verdad y por qué?". Solape peligroso: mismo ICP y rango de precio. Nuestro terreno: credibilidad del número + tipologías que no tocan.

## Adyacentes

- **Cassandra AI**: AVM institucional (fondos/bancos), sin precios públicos. Amenaza baja en SME.
- **Lystos**: suite agencias 79-199€ + addons de 15,90€/mes por Catastro y Nota Simple → **VALIO incluye Catastro de serie: argumento de venta**.
- **Casafari**: enterprise, permanencia 12 meses. "Inmoanalytics" no existe como SaaS.

## Recomendaciones para el backlog (por impacto)

1. **Módulo rentabilidad inversor sobre la valoración** — M — → EN CURSO (iteración 2).
2. **UX "resultado en <2 min" + free tier 2-3 valoraciones** — S — el autorrelleno Catastro ya está en Plan 2.1; falta freemium (Plan 3 billing).
3. **SEO comparativo**: páginas /vs/invisor, /vs/cassandra, /vs/lystos, /comparativa con precios públicos y "sin addons" — S — Plan 3 landing; Invisor gana esas búsquedas sin competencia hoy.
4. **"Memorándum de inversión" white-label como formato estrella del PDF** — M — con trazabilidad real que ellos no tienen.
5. **Publicar la precisión (MdAPE/PPE10) + página "por qué a veces rehusamos valorar"** — S — nadie del segmento publica métricas de error; convierte "orientativo" en credibilidad.

## No verificado

Cómo obtiene Invisor los datos de portales (no lo declaran); pantallas internas (demo requiere registro); tracción real; precios de Cassandra/Casafari/Lystos-inversor (solo vía comparativas del propio Invisor, fuente interesada).
