# data/ — datos fuente locales de VALIO

Aquí van los datos crudos que alimentan los ETLs. **Nada de esta carpeta con datos
personales o de operaciones se commitea** (ver .gitignore cuando exista el repo propio).

Esperado:
- `socio/` — CSV/XLSX de la cartera y cierres del socio (anonimizar en ingesta).
- `ine/` — Atlas de Renta por sección censal + shapefiles de secciones censales.
- `serpavi/` — BD de rangos de alquiler (descarga semi-manual, WAF).
- `registradores/` — estadística de cierres por provincia (solo calibración, ODbL).
- `mivau/` — valor tasado por municipio (Boletín Estadístico).
- `opendata-bcn/` — compraventas y precios por barrio.
