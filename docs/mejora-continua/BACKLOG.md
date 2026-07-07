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
| P4 | 🛡️ **Ocupación como titular del informe** (% sobre valor de mercado, regla inversor 60-70%) | F12; ninguna herramienta reseñada lo cubre; VALIO ya calcula el ajuste | S | backlog |
| P5 | 🛡️ **Alquiler estimado + flag zona tensionada** por sección censal | F6 (idealista lo cobra B2B) + F8; encaja con pipeline INE/SERPAVI | M | backlog (tras Plan 2.1 completo) |
| P6 | 📋 **Informe PDF white-label** con testigos citados y gráficos legibles | F1 — feature más valorada por agencias en toda la evidencia pro | M | backlog (Plan 3) |
| P7 | 📋 **Anti-lead-gen como posicionamiento** (sin teléfono, sin vender leads, pricing público) | Q7 RealAdvisor vende leads >56€ + Q8 Trovimap 2,7/5 | S (copy landing) | backlog (Plan 3) |
| P8 | 📋 **Estimación de reforma por niveles + escenarios conservador/realista/optimista** | F9+F13 (Invisor la tiene y presume) | M | backlog |
| P9 | 📋 Histórico y re-valoración periódica de cartera | Q5/Q10 patrón Zestimate | M | backlog |
| P10 | 📋 Análisis desde URL de anuncio + historial del anuncio | F10+F11 — demanda alta pero scraping frágil/riesgo legal (regla de oro nº1) | L | congelado (revisar con APIs del socio) |
| — | Export cartera Excel/CSV | petición típica agencias | S | backlog |
| P11 | 📋 UX "resultado en <2 min" + free tier 2-3 valoraciones | Estudio Invisor rec.2 — la fricción de entrada es el campo de batalla | S | backlog (freemium → Plan 3) |
| P12 | 📋 SEO comparativo: /vs/invisor, /vs/cassandra, /vs/lystos, /comparativa | Estudio Invisor rec.3 — gana esas búsquedas sin competencia hoy | S | backlog (Plan 3 landing) |
| P13 | 📋 "Memorándum de inversión" white-label como formato del PDF | Estudio Invisor rec.4 — ellos lo venden premium sin trazabilidad real | M | backlog (con P6) |
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

### Iteración 4 — siguiente
- Candidatos: **P8-lite** (escenarios conservador/realista/optimista sobre la
  RentabilityCard — S/M, puro), **export CSV cartera** (S), o **Plan 2.1
  Tasks 7-8** (form con autocomplete — funciona parcialmente sin Supabase).
  P3/P5 siguen bloqueados por datos; P6/P7/P11-P13 son de Plan 3 (landing/PDF).
