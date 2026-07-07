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
| P2 | 📋 **Módulo rentabilidad inversor post-impuestos**: yield neto, cash-flow con hipoteca, ITP por CCAA, notaría/registro, IRPF reducciones 50/60/70/90%, vacancia por defecto | F3+F4+F5 (evidencia ALTA: Rankia, Forohipotecario; "Casafari no calcula rentabilidad neta ni cash-flow") | M | **→ iteración 2** |
| P3 | 🛡️ **Doble precio: valor de anuncio vs valor de cierre estimado** con diferencial por zona | Q1 dispersión 3x entre valoradores + Q2 precios inflados 10-20% (test empírico HelpMyCash) | M | backlog (necesita calibración Registradores — Plan 2.3) |
| P4 | 🛡️ **Ocupación como titular del informe** (% sobre valor de mercado, regla inversor 60-70%) | F12; ninguna herramienta reseñada lo cubre; VALIO ya calcula el ajuste | S | backlog |
| P5 | 🛡️ **Alquiler estimado + flag zona tensionada** por sección censal | F6 (idealista lo cobra B2B) + F8; encaja con pipeline INE/SERPAVI | M | backlog (tras Plan 2.1 completo) |
| P6 | 📋 **Informe PDF white-label** con testigos citados y gráficos legibles | F1 — feature más valorada por agencias en toda la evidencia pro | M | backlog (Plan 3) |
| P7 | 📋 **Anti-lead-gen como posicionamiento** (sin teléfono, sin vender leads, pricing público) | Q7 RealAdvisor vende leads >56€ + Q8 Trovimap 2,7/5 | S (copy landing) | backlog (Plan 3) |
| P8 | 📋 **Estimación de reforma por niveles + escenarios conservador/realista/optimista** | F9+F13 (Invisor la tiene y presume) | M | backlog |
| P9 | 📋 Histórico y re-valoración periódica de cartera | Q5/Q10 patrón Zestimate | M | backlog |
| P10 | 📋 Análisis desde URL de anuncio + historial del anuncio | F10+F11 — demanda alta pero scraping frágil/riesgo legal (regla de oro nº1) | L | congelado (revisar con APIs del socio) |
| — | Export cartera Excel/CSV | petición típica agencias | S | backlog |

⚠️ Competidor a estudiar de cerca: **Invisor** (invisor.es) — el más parecido a VALIO en
el segmento inversor; sus comparativas críticas con CASAFARI/Betterplace son interesadas.

## Iteraciones

### Iteración 1 — 2026-07-07 (en curso)
- Infraestructura del loop creada (este archivo + PENDIENTES-SOCIO.md).
- Lanzada investigación de reseñas/quejas de usuarios sobre valoradores (Idealista
  valorador, CASAFARI, Betterplace, RealAdvisor, Zestimate, G2/Capterra, foros de
  inversores ES) para ampliar/repriorizar el backlog con señal real.
- Siguiente al recibir la investigación: priorizar y ejecutar la primera mejora.
