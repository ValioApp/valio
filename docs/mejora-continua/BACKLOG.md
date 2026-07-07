# Mejora continua VALIO — backlog y bitácora del loop

> Loop de automejora pedido por Alex (2026-07-07): investigar quejas de usuarios y
> gaps de la competencia → priorizar aquí → implementar con TDD y revisión → commit
> local → registrar. Condición de parada: SaaS claramente superior en features útiles.
> Reglas: nunca romper las reglas de oro del CLAUDE.md; lo del socio → placeholder +
> PENDIENTES-SOCIO.md; producción/deploy siempre con aprobación de Alex (Fase 1).

## Candidatos iniciales (de la investigación de mercado 2026-07-06)

| # | Feature | Fuente de la señal | Esfuerzo | Estado |
|---|---|---|---|---|
| C1 | Informe PDF white-label con logo del cliente | Betterplace lo tiene; agencias lo piden para captar exclusivas | M | backlog |
| C2 | Análisis de rentabilidad para inversores (yield bruto/neto, precio máximo de compra dado un yield objetivo) | Inversores = segmento nº1; nadie lo da junto a la valoración | M | backlog |
| C3 | "Valor vs precio pedido" (detector de oportunidades: % de sobreprecio del anuncio) | Queja clásica: los portales inflan precios | S | backlog |
| C4 | Histórico y re-valoración (tracking del valor de un inmueble en el tiempo) | Zestimate lo tiene; en España nadie self-service | M | backlog |
| C5 | Exportar cartera a Excel/CSV | Petición típica de agencias | S | backlog |
| C6 | Confianza explicada ("por qué media y no alta: solo 8 testigos, dispersión 12%") | Queja nº1 de AVMs: caja negra | S | backlog |

## Iteraciones

### Iteración 1 — 2026-07-07 (en curso)
- Infraestructura del loop creada (este archivo + PENDIENTES-SOCIO.md).
- Lanzada investigación de reseñas/quejas de usuarios sobre valoradores (Idealista
  valorador, CASAFARI, Betterplace, RealAdvisor, Zestimate, G2/Capterra, foros de
  inversores ES) para ampliar/repriorizar el backlog con señal real.
- Siguiente al recibir la investigación: priorizar y ejecutar la primera mejora.
