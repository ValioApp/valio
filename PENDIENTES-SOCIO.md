# PENDIENTES-SOCIO — cosas que necesitan al socio de Alex

> Regla de trabajo (2026-07-07): todo lo que dependa del socio se implementa con
> **placeholder** y se registra AQUÍ para pedírselo en bloque. No bloquea desarrollo.

| # | Qué necesitamos | Para qué | Placeholder actual | Estado |
|---|---|---|---|---|
| 1 | **Claves API de Idealista** (y doc de acceso que le dieron) | Adapter de comparables reales (`ComparableSource`) | Seeds sintéticos + arquitectura de adapters lista | ⏳ |
| 2 | **Claves/accesos de Fotocasa y otros portales** que dice tener | Más adapters de comparables | Ídem | ⏳ |
| 3 | **CSV/Excel de su cartera y cierres reales** (con estado de ocupación) | La fuente de máxima fiabilidad del motor + calibración de coeficientes | Coeficientes v0 heurísticos (`coefficients.ts`, marcados "recalibrar con cierres del socio") | ⏳ |
| 4 | ~~OK al nombre~~ **RESUELTO por Alex (2026-07-07): el nombre es VALIO.** Aviso vigente: marca UE de Valio Oy (láctea) — validar dominio/marca (valio.es, valio.app) antes de invertir en branding | — | Nombre definitivo VALIO | ✅ |
| 5 | **Conocimiento de zona/mercado** (descuentos de negociación reales por zona, yields que maneja) | Calibrar `negotiation_discount` por zona (ahora 6-8% heurístico en seeds) | Valor por defecto 0.06 en `zone_stats` | ⏳ |
| 6 | **Operaciones de naves industriales** que tenga documentadas | Módulo naves v1.5 (comparables industriales escasos = su dato es oro) | Módulo naves pospuesto a v1.5 | ⏳ |

**Cuando Alex se reúna con el socio:** repasar esta tabla de arriba a abajo; con 1+3 se
desbloquea el Plan 2.2 (importador + adapter Idealista) y la recalibración del motor.
