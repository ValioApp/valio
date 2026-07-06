---
name: valio-feature
description: Usar cuando se va a implementar una feature de VALIO (SaaS de valoración orientativa de inmuebles, Next.js 16 + Supabase/PostGIS + Stripe) tocando el motor de valoración, los adapters de datos, los ETLs de zona o la capa SaaS multi-tenant.
---

# Implementar una feature de VALIO

## Antes de tocar código

1. Lee `docs/2026-07-06-valio-design.md` (spec canónico) y el `CLAUDE.md` del mundo
   (reglas de oro). Si la feature contradice una regla de oro, PARA y consulta a Alex.
2. Localiza la pieza afectada: **adapter de ingesta** (`ComparableSource`), **pipeline
   de zona** (ETL + `zone_stats`), **motor** (`ValuationEngine`, funciones puras de
   ajuste), o **capa SaaS** (workspaces/billing/UI).

## Reglas al implementar

- **Motor**: los coeficientes de ajuste son funciones puras con test Vitest. Todo cambio
  de coeficientes se documenta en el propio módulo (fuente y fecha de calibración).
  El output siempre incluye horquilla + confidence + testigos; con <6 testigos, rehusar.
- **Adapters**: nueva fuente de comparables = nueva implementación de
  `ComparableSource`; nunca lógica de fuente dentro del motor. Credenciales en env/vault.
- **Supabase**: migración nueva correlativa (nunca editar aplicadas), toda tabla con
  `workspace_id` + RLS + `created_at`/`updated_at`. Geometrías en PostGIS (SRID 4326).
- **Legal**: ningún texto de UI/informe/marketing puede decir "tasación"; el disclaimer
  de "valoración orientativa" es obligatorio en cada output nuevo que muestre un valor.
- **Datos**: nunca mezclar precios de anuncio y de cierre sin la marca
  `is_closing_price`; métricas de calidad solo contra cierres.

## Al terminar

- Tests del motor en verde + Playwright si tocaste el flujo de valoración.
- Actualiza el estado en el `CLAUDE.md` del mundo si cambia algo estructural.
- Fase 1: presenta el resultado a Alex antes de dar nada por desplegable.
