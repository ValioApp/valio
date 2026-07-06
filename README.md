# VALIO — valoración orientativa de inmuebles con factor zona

**El pitch:** la única herramienta con precios públicos que valora inmuebles fusionando
datos oficiales (Catastro, INE, Registradores) con los datos de cierre reales del propio
cliente, y que explica cuánto pesa el barrio en el precio ("ajuste por renta de la zona:
+18%") y el estado de ocupación. Orientativa por diseño; no es tasación oficial.

## Por qué existe (huecos verificados 2026-07-06)

1. Nadie da a agencias/inversores el **factor zona explicable** (uDA/Accumin lo vende
   caro a banca; se construye gratis con INE ADRH + SERPAVI).
2. **No existe valorador automático de naves industriales en España** (v1.5 de VALIO).
3. Todos los competidores esconden precios tras demos; **pricing público self-service**
   convierte por sí solo.
4. Ni CASAFARI ni Betterplace fusionan **los datos propios del cliente** como fuente de
   primera clase.

## Documentos

- `docs/2026-07-06-valio-design.md` — spec de diseño aprobado (leer primero).
- `docs/2026-07-06-informe-mercado.md` — investigación: fuentes de datos, APIs reales de
  portales, competidores, metodología AVM, riesgos legales.

## Estado

- ✅ 2026-07-06 — Diseño aprobado por Alex. Mundo creado (Fase 1).
- ⏳ Plan de implementación del MVP.
- ⏳ Fase 0 (Alex): claves de APIs del socio + su CSV; presupuestos de agregadores.

## Estructura prevista

```
VALIO/
├── CLAUDE.md            # contexto del mundo (leer siempre)
├── README.md            # este archivo
├── docs/                # spec + investigación
├── data/                # datos fuente locales (CSV socio, shapefiles INE…) — NO commitear datos personales
├── app/                 # (futuro) Next.js 16
└── supabase/            # (futuro) migraciones
```
