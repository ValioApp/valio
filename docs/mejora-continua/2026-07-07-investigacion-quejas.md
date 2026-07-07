# Investigación de mercado VALIO — Quejas reales y gaps de features en valoradores inmobiliarios

Investigación verificada 2026-07-07 (~130 tool-calls de búsqueda/fetch en 4 hilos). Notas de honestidad: Trustpilot, ForoCoches y Burbuja.info bloquean el fetch directo (403) — para esas fuentes las citas vienen de snippets indexados y se marca la evidencia como media. Reddit verificado vía archivo pullpush.io. r/SpainFIRE sin hilos indexados sobre valoradores.

## (a) Quejas encontradas

| # | Queja | Herramienta | Fuente | Frecuencia | Evidencia |
|---|---|---|---|---|---|
| Q1 | **Dispersión brutal entre valoradores: el mismo inmueble varía hasta 3x** (Fotocasa 345-353k€ vs Valoración.es 121-164k€ mismo chalet). "So 121k-353K… It's BS" | Idealista, Fotocasa, RealAdvisor, Kutxabank | Valencia Property · HelpMyCash (test empírico) · Rankia: "cada una me dice una cosa diferente" | Muy común | **Fuerte** |
| Q2 | **Usan precios de anuncio, no de cierre** — diferencial asking-notarial 10-20% (>50% en provincias vacías). "Si todos tus vecinos han inflado sus precios un 10%, el valorador te dirá que tu casa también vale ese 10% más" | Todos los valoradores ES | HelpMyCash · QualisOptima · 1001portales | Muy común | **Fuerte** |
| Q3 | **No considera reformas / estado interior**. Fundador de uDA: "hay características de la vivienda que es imposible introducir en los modelos actuales"; error AVM España "entre el 10 y el 20%" (vs 7% EEUU). Reddit: "Zillow have no idea what kind of upgrades have been done" (233 pts) | Todos los AVM | Inmoblog (entrevista Carlos Olmos/uDA) · r/RealEstate | Muy común (nº1 en volumen Reddit) | **Fuerte** |
| Q4 | **No explica el porqué del valor — "black box"**. "black-box undisclosed math model WITHOUT detailed local aspects factored-in" | Zestimate, Redfin, valoradores ES | r/RealEstate · r/realtors | Común | **Media-fuerte** |
| Q5 | **El AVM "hace trampa": copia el precio de lista al publicarse** — precisión on-market ilusoria. Error mediano Zillow: 1,9% on-market vs **7,0% off-market** | Zestimate, Redfin | r/RealEstate (285 pts) · realestatewitch.com | Muy común | **Fuerte** |
| Q6 | **Saltos bruscos sin explicación**: "My personal home 'Zestimate' went from $550,000 to $310,000 the day I closed". ES: hilos ForoCoches "Idealista ha bajado la valoración un 10-20%" (feb 2023) | Zestimate, Idealista | r/realtors · r/FirstTimeHomeBuyer · ForoCoches | Muy común | Fuerte (US) / Media (ES) |
| Q7 | **Lead-gen encubierto**: valoración gratis como cebo; leads vendidos a agencias >56€. Agencia: "De los 80 contactos prometidos, ninguno mostró interés genuino… EN CUANTO PAGAS, DESAPARECEN" | RealAdvisor (y Housfy) | foroinmobiliario.es · Trustpilot (snippets) | Común | **Fuerte** (lado agencia) |
| Q8 | **"Gratis" engañoso**: Trovimap **2,7/5 en Trustpilot** (la peor del sector) por cobrar tras la valoración inicial | Trovimap | Trustpilot | Ocasional | Media-fuerte |
| Q9 | **Valoradores bancarios contradictorios y ~15% cortos vs tasación oficial** (BBVA 144,9k, Bankia 142,8k vs tasación 163,3k). "las tasaciones on line sólo me han servido para llevarme un disgusto" | Valoradores bancarios | Rankia (verificada) | Común | **Fuerte** |
| Q10 | **Ancla expectativas de vendedores y quema listings** (queja de agentes): "sellers anchor to whichever number is highest" | Zestimate → exportable a ES | housingwire · fastexpert | Muy común (US) | **Fuerte** |
| Q11 | **Duplicados contados como testigos distintos**: "Una misma casa publicada por tres agencias… puede contar como tres casas" | Valoradores ES | QualisOptima | Ocasional | Media (parte interesada) |
| Q12 | **Pro: precios ocultos + contrato anual renovación automática**; "desde 99€/mes" ya se ve caro para agencia pequeña | CASAFARI, PriceHubble, Brainsre, Betterplace | invisor.es · inmorobot.com | Común | Media |
| Q13 | **Zonas rurales/poco líquidas: error >15%** por escasez de comparables | Todos los AVM | 1001portales · guía AVM BdE | Común | Fuerte |
| Q14 | **Ni Zillow confió en su AVM con dinero propio** — Zillow Offers cerró con pérdidas >$500M | Zillow | SEC 8-K Q3 2021 | — | **Muy fuerte** |

**Hallazgo meta**: CASAFARI, PriceHubble, Brainsre y Betterplace tienen cero o casi cero reseñas públicas en G2/Capterra/Trustpilot — en este B2B se compra por demo, no por reviews. El pricing público de VALIO ya es diferencial.

## (b) Features pedidas/valoradas

| # | Feature | Quién | Evidencia | Fuerza |
|---|---|---|---|---|
| F1 | **Informe PDF explicable y bonito** — arma de captación nº1: "los gráficos son muy fáciles de leer y permiten que los particulares entiendan que el valor es real" | Agencias | Case study Urbenia/Betterplace · maklersoftware-vergleich (PriceHubble) | Media |
| F2 | **Testigos reales, deduplicados y trazables** para justificar precio | Agencias | InmoRobot/CASAFARI · Rankia | Media-alta |
| F3 | **Rentabilidad neta + cash-flow con hipoteca** + ROCE/cash-on-cash/PER. Gap explícito: Casafari "no calcula rentabilidad neta, TIR ni cash-flow" | Inversores (Rankia, Libertad Inmobiliaria, Forohipotecario) | Rankia · Forohipotecario · Invisor | **Alta** |
| F4 | **ITP automático por CCAA + notaría/registro/gestoría** en coste de adquisición (hoy manual en todas) | Inversores | Rankia · ECDI | Alta |
| F5 | **Fiscalidad IRPF post-impuestos con reducciones 50/60/70/90%** — gap más citado de las calculadoras: "Esta calculadora no tiene en cuenta los impuestos" | Inversores buy-to-let | javilinares.com · AEAT | **Alta** |
| F6 | **Alquiler estimado por zona + demanda** — idealista/data lo vende B2B | Inversores y agencias | idealista/data | Alta |
| F7 | **Vacancia ≠ 0 + riesgo impago/desahucio por zona** (>18 meses BCN/Madrid; deuda media impago BCN 14.036€) | Inversores conservadores | Rankia 2026 · idealista/news | Media-alta |
| F8 | **Flag zona tensionada + índice referencia alquiler** (condiciona renta y reducción IRPF) | Inversores | Rankia 2026 | Media |
| F9 | **Estimación de reforma por niveles** — Invisor la tiene y presume vs Betterplace | Inversores value-add | Invisor | Media-alta |
| F10 | **Análisis desde URL del anuncio + alertas/scoring** | Usuarios Invisor/Cassandra | Invisor | Media-alta |
| F11 | **Historial del anuncio**: bajadas, tiempo en mercado, republicaciones | Cazadores de gangas | Substack Inversor Inteligente | Media |
| F12 | **% sobre valor para ocupado/nuda propiedad/subasta**: regla "rara vez >60-65% del valor real; si pagas >70%, replantéatelo"; descuentos 40-60% | Inversores distressed | Subastanomics · Infobae | Media |
| F13 | **Escenarios conservador/realista/optimista** | Comunidad ECDI | ECDI | Media |
| F14 | **Widget de valoración embebible** (leads para el agente) | Agentes | maklersoftware-vergleich | Media |
| F15 | **Alquiler turístico: ADR/ocupación por dirección** (AirDNA cobra por esto) | Inversores STR | AirDNA | Media-alta |

## (c) Top 10 oportunidades (ver BACKLOG.md para priorización viva)

1. 🛡️ "El porqué del valor" explicable (Q4+Q6) — impacto altísimo, esfuerzo bajo, la competencia black-box no puede copiarlo sin rediseñar su modelo.
2. 🛡️ Doble precio anuncio vs cierre estimado (Q1+Q2) — los portales no pueden copiarlo (canibaliza su negocio).
3. 📋 Rentabilidad completa post-impuestos (F3+F4+F5) — la evidencia más fuerte del lado inversor.
4. 🛡️ Ocupación como titular (F12) — nadie lo cubre; VALIO ya lo calcula.
5. 🛡️ Alquiler estimado + zona tensionada por sección censal (F6+F8).
6. 📋 Informe PDF profesional (F1).
7. 📋 Rango honesto con confianza real por zona (Q13, Q5).
8. 📋 Anti-lead-gen como posicionamiento (Q7+Q8+Q12) — RealAdvisor/Housfy no pueden copiarlo.
9. 📋 Reforma por niveles + escenarios (F9+F13).
10. 📋 Análisis desde URL + historial del anuncio (F10+F11) — esfuerzo alto, riesgo legal scraping.

**Advertencias**: evidencia ES de consumidores más fina que la US (transferencia = inferencia razonable); parte de la crítica viene de tasadores con interés (QualisOptima, Valencia Property); **Invisor es competidor directo** y fuente interesada; sin quejas citables en r/SpainFIRE.
