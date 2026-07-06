# Informe de síntesis — SaaS español de valoración de inmuebles con factor zona
**Fecha:** 06-07-2026 · **Base:** hallazgos verificados de 6 investigadores (portales, agregadores, open data, competidores, naves industriales, metodología AVM)

---

## 1) Fuentes de datos viables HOY

### 1.1 Gratuitas y legales (la columna vertebral del producto)

| Fuente | Qué da | Coste | Cómo acceder |
|---|---|---|---|
| **Catastro OVC (servicios libres)** | Por referencia catastral o dirección: superficie construida, uso, año de construcción, localización. NO da valor catastral ni titularidad (protegidos) | 0 € | REST/SOAP sin API key: `ovc.catastro.meh.es/.../Consulta_DNPRC`. Cachear agresivamente |
| **Catastro INSPIRE (ATOM/GML)** | Descarga masiva de parcelas, edificios (año, uso) y direcciones por municipio | 0 € | ZIP por municipio, GML 3.2.1. Plugin QGIS o CLI Geomatico. Actualización semestral |
| **INE — Atlas de Renta (ADRH)** | Renta media/mediana por persona y hogar, Gini, P80/P20 **por sección censal** (serie 2015-2023). **Es el "factor Raval vs Sarrià"** | 0 € (CC BY) | CSV/Excel/JSON desde INEbase + API Tempus3. Shapefile de secciones censales del INE para geocodificar |
| **MIVAU — SERPAVI** | Rangos €/m² de alquiler real (datos fiscales AEAT) por **sección censal**. BD Excel 2011-2024 | 0 € | serpavi.mivau.gob.es. Web con WAF: prever descarga semi-manual |
| **MIVAU — Valor tasado vivienda** | €/m² de tasación por municipio >25.000 hab, trimestral desde 1995 | 0 € | Excel desde el Boletín Estadístico (apps.fomento.gob.es). Bloquea fetch automatizado |
| **Registradores — Open Data** | **Precios de CIERRE reales** por provincia, trimestral desde 2007. Incluye residencial, comercial e **industrial (naves)** | 0 € (ODbL — ojo share-alike) | opendata.registradores.org. WAF activo: descarga con headers de navegador |
| **Open Data BCN** | Compraventas registrales y precios de oferta **por barrio** (73 barrios), alquileres (fianzas Incasòl), catastro municipal | 0 € (CC BY) | API CKAN sin token + CSV. Validar vigencia dataset a dataset |
| **datos.madrid.es** | Catastro y estadística registral por distrito/barrio | 0 € | Descarga XLSX |
| **SIPAE (Generalitat)** | Censo de **1.448 polígonos** de Cataluña: superficie, parcelas, usos, edificabilidad, alturas, suministros, georreferenciado | 0 € | Visor + dataset abierto (IDE Catalunya, `sipae-poligon`). Caveat: solo 39% de municipios validaron la actualización 2024 |
| **AMB — Naus i Solars** | **€/m² de venta y alquiler de naves y solares por municipio y polígono** (área metropolitana BCN) | 0 € | nausisolars.amb.cat, web abierta. La fuente pública más granular de industrial en España |
| **CNIG — Mapa Suelo Industrial** | Capa nacional de polígonos industriales en formatos SIG | 0 € | centrodedescargas.cnig.es |
| **ATC Catalunya — valores básicos** | Valores de suelo y construcción por uso (incl. industrial) para comprobación ITP | 0 € | PDF anual |
| **Informes CBRE/JLL/BNP RE** | Yields prime logística (4,85% cierre 2025), rentas prime por mercado (5,65–9 €/m²/mes) — calibran el método de capitalización | 0 € | PDFs trimestrales públicos. CBRE devuelve 403 a bots: descarga manual |

### 1.2 De pago / bajo contrato (para escalar los comparables)

| Fuente | Qué da | Coste | Cómo acceder |
|---|---|---|---|
| **idealista/data** | API de testigos actuales e históricos, valoraciones, catastro, métricas hasta barrio | **No público** — presupuesto por proyecto | Comercial B2B ("déjanos tus datos"). Pedir presupuesto YA: condiciona el pricing del SaaS |
| **CASAFARI Property Data API** | Comparables deduplicados de 30.000+ fuentes, histórico por inmueble, AVM, stats de zona, **cubre industrial** | No público; estimado desde cientos de €/mes; **contrato mínimo 12 meses** con renovación automática | Demo comercial |
| **Brainsre** | Big data con fuentes oficiales (Registro, INE, Catastro), fuerte en **terciario/naves**, con API | No público (versión gratuita limitada en app.brainsre.com) | sales@brainsre.com |
| **DataVenues / Fotocasa Pro Data** | ~3M anuncios de Fotocasa+Habitaclia+Milanuncios deduplicados, con "API services". **Única vía legítima a esos 3 portales** | No público (planes ONE/PRO/enterprise) | Comerciales de Fotocasa/Habitaclia (hoy Scout24) |
| **uDA / Accumin Intelligence** | AVM + grids de comparables + 190 indicadores de zona vía API | No público, enterprise | Comercial |
| **CSV/Excel del socio** | **Precios de cierre reales**, incl. operaciones industriales. Es el activo diferencial que nadie más tiene | 0 € | Importador CSV/XLSX + soporte del XML estándar que exportan los CRMs (Inmovilla, Inmofactory) |

---

## 2) Realidad de las APIs de portales — lo que NO se puede hacer

Hay que ser tajante aquí porque condiciona toda la arquitectura:

- **Idealista API oficial: acceso restringido, punto.** Se solicita en developers.idealista.com con aprobación manual y discrecional. Sin pricing público, sin tiers self-service. La comunidad reporta cuota gratuita ínfima (~100 req/mes, **cifra no confirmada**). Único límite verificado: 50 resultados/página. La documentación real solo llega por email si te aprueban. Tipologías confirmadas: homes, offices, premises, garages, bedrooms — **"premises" mezcla locales y naves sin filtro de polígono**, y `lands`/`buildings` no están confirmados en la API oficial. **No se puede montar un negocio sobre esta API.** Para volumen: contrato B2B con idealista/data.
- **Fotocasa, Habitaclia, pisos.com, Milanuncios, yaencontre: NINGUNO tiene API pública de lectura.** Todas sus "APIs" y feeds son unidireccionales de **publicación** (CRM → portal), no de extracción. La vía legítima a datos de Fotocasa/Habitaclia/Milanuncios es DataVenues; yaencontre converge con idealista/data (fue absorbido por Idealista).
- **ToS: el scraping está expresamente prohibido** en Fotocasa/Adevinta (robots/crawlers, reutilización de BD) y equivalentes en el resto. pisos.com tiene CDN anti-bot activo (403 verificado). Los scrapers de Apify/RapidAPI funcionan técnicamente pero no son base legal para un SaaS comercial español (ver sección 5).
- **Belbex Pro (CoStar): jardín cerrado.** La mejor base de terciario/industrial verificada de España, por suscripción, sin API, y CoStar litiga agresivamente contra reutilización. Descartar como fuente.
- **Contexto M&A que puede mover el tablero:** Fotocasa+Habitaclia son de **Scout24** desde marzo 2026; Milanuncios quedó en EQT; Idealista es de Cinven. Las políticas de licencia de datos pueden cambiar — hablar con DataVenues y CASAFARI **antes** de fijar la arquitectura definitiva.

**Conclusión práctica:** los comparables de portales solo entran al producto por tres vías: (a) contrato con un agregador/proveedor (idealista/data, CASAFARI, DataVenues, Brainsre), (b) datos del socio, (c) open data. El scraping directo solo sirve para prototipar en privado.

---

## 3) Mapa competitivo y hueco de mercado

El mercado está partido en dos polos con un hueco claro en medio:

**Polo enterprise (inaccesible para agencias pequeñas):** Tinsa Digital, uDA y Deyde operan juntas desde 2024 como **Accumin Intelligence** (dato "uDA es de Alantra" = desactualizado); Gloval (AVM XGBoost para banca), Valum (ex Instituto de Valoraciones), idealista/data AVM (homologado ECO/805 + guía AVM del BdE). Todos venden a banca/servicers con contratos enterprise y precios ocultos. **Ninguno hace self-service.**

**Polo lead-gen gratuito (sin profundidad profesional):** Housfy, Clikalia, Trovimap, RealAdvisor, el valorador gratuito de Idealista. Solo residencial, monetizan el lead del propietario, no son herramienta de trabajo.

**En medio, solo dos jugadores para agencias:**
- **CASAFARI** — potente pero caro, contrato anual, sin precios públicos, foco residencial paneuropeo.
- **Betterplace** — el competidor más directo: comparables nacionales + informes white-label + declara cubrir locales/almacenes/terrenos. Debilidades: no publica precios, no fusiona datos propios del cliente, no expone factores socioeconómicos explicables de microzona.

**Huecos detectados (por orden de defensa):**
1. **AVM de naves industriales/polígonos: no existe en España.** Verificado uno a uno: idealista/data es residencial-céntrico, RealAdvisor "tasación de naves online" es SEO lead-gen, Tasvalor/Ibernave son tasación tradicional con visita, y hasta el Catastro **excluye el uso industrial de su valor de referencia**. Las tasadoras (CoHispania) admiten que los AVM no llegan donde no hay datos homogéneos. El CSV de operaciones industriales del socio es exactamente el dato escaso que bloquea a los grandes.
2. **Factor zona explicable.** uDA lo vende caro a banca; nadie se lo da a una agencia con la línea "ajuste por renta de zona: +18%" en el informe. Se construye gratis con INE ADRH + SERPAVI.
3. **Pricing transparente self-service.** TODOS los competidores esconden precios tras demos y contratos anuales. Publicar tiers de 49–199 €/mes ya convierte por sí solo.
4. **Fusión de datos propios del cliente** como fuente de comparables de primera clase: ni CASAFARI ni Betterplace lo hacen.

---

## 4) Cómo debería funcionar el motor de valoración

**Arquitectura común:** capa de ingestión multi-fuente desacoplada (un adapter por fuente: agregador contratado, CSV/XML del socio, Catastro, INE, Registradores) → normalización a un esquema único de "comparable" en Supabase/PostGIS → motor por tipología → output siempre como **valor + horquilla + confidence score (tipo FSD) + desglose de comparables y ajustes**.

**Pipeline de zona (compartido):** geocodificación → sección censal (shapefile INE) → features precalculadas: coeficiente de renta (renta sección ÷ renta municipio, ADRH), rango de alquiler SERPAVI, calibración de precio por provincia (Registradores, cierres reales), municipio (MIVAU) y barrio (open data BCN/Madrid). Todo esto es batch (ETL trimestral/anual con n8n o cron); solo Catastro OVC va en tiempo real.

### Por tipología

**Pisos y casas urbanas — AVM completo:**
- Motor: **gradient boosting (LightGBM/XGBoost)** sobre precio/m² — estándar de facto de la industria, mejor que redes profundas en tabular mediano y explicable con SHAP.
- Features: atributos físicos (Catastro + input usuario) + lat/lon + target-encoding por zona + **renta de sección censal como feature de primera clase**.
- Capa de presentación tipo "appraisal emulation": los 6–20 testigos más similares con sus ajustes de homogeneización — es lo que el usuario entiende y lo que exige la trazabilidad estilo ECO/805 (que pide **mínimo 6 testigos** con fuente).
- **Entrenar contra precio de cierre siempre que se pueda** (CSV del socio + Registradores). Si se usan asking prices: ajuste listing-to-close **por zona y días en mercado** (media España ~6,2%, rango 1–15%), nunca un % fijo — el gap agregado portal-vs-notario llega al 44% por sesgo de composición.
- Métricas: MdAPE y PPE10 por backtesting out-of-time, contra cierres, nunca contra anuncios. Objetivo realista: **MdAPE 5–9% en pisos urbanos** (el ~2% de Zillow es inalcanzable sin historial transaccional público). Con <6 comparables: rehusar valorar o degradar a "orientativo" — mejor no valorar que valorar mal.

**Naves industriales y suelo en polígonos — módulo separado, NO un AVM puro:**
El mercado es fino y heterogéneo (la EAA y el propio art. 15 bis español limitan los AVM a inmuebles homogéneos). Reconciliar **tres métodos** y presentar horquilla amplia con desglose:
1. **Comparación asistida:** asking prices (idealista si conceden acceso / agregador) + **cierres del socio** + €/m² industrial de Registradores para corregir sesgo oferta-cierre. En el AMB, benchmark con Naus i Solars por polígono.
2. **Capitalización de rentas:** renta €/m²/mes estimada de la zona ÷ yield del mercado (calibrado con CBRE/JLL/BNP: prime logística 4,85% a cierre 2025).
3. **Coste de reposición** como suelo mínimo: valor suelo (ATC/Estadística de Precios de Suelo) + coste construcción 2026 + ~12% honorarios − depreciación.

Formulario con las features que un AVM residencial no captura: altura libre, luz entre pilares, muelles de carga, potencia eléctrica, % oficinas, tipo A/B/C incendios, geometría de parcela, calificación urbanística, distancias a autopista/puerto (routing OSM). El "factor zona" industrial = calidad/servicios del polígono (SIPAE) + corona logística.

**Locales comerciales:** híbrido — comparables donde haya densidad + capitalización de rentas; confidence más bajo que residencial.

---

## 5) Riesgos legales y regulatorios

- **Scraping de portales = riesgo real, no teórico.** ToS que lo prohíben expresamente + derecho sui generis de bases de datos + doctrina Ryanair del Tribunal Supremo (competencia desleal). Un SaaS comercial español construido sobre scraping de Idealista/Fotocasa es demandable y además frágil (bloqueos técnicos activos). Uso máximo tolerable: prototipado interno, nunca pipeline de producción.
- **Tasación oficial vs valoración orientativa — la línea es nítida y hay que respetarla en todo el producto:** la tasación hipotecaria exige sociedad homologada por el Banco de España, visita e informe firmado (ECO/805/2003; validez 6 meses). La **Orden ECM/599/2025** (en vigor 12-08-2025) introduce por primera vez los AVM en la normativa… **reservándolos a sociedades de tasación homologadas** y solo para carteras hipotecarias. El SaaS DEBE venderse como "valoración orientativa / herramienta profesional de pricing, captación e inversión" con disclaimer visible en cada informe. Lado positivo: la orden legitima la metodología y abre un upsell futuro (convenio con tasadora homologada; o vender el motor a tasadoras cuando el BdE publique su circular).
- **Licencias de open data:** Registradores es **ODbL 1.0 con share-alike** — si su BD se integra en la BD derivada del SaaS puede arrastrar obligación de compartir; usarla como capa de calibración agregada y revisar con abogado. INE/open data municipal son CC BY (basta atribución).
- **RGPD:** los datos de zona (INE, SERPAVI) son agregados, sin problema. Los riesgos están en: (a) datos del socio con identificación de partes en operaciones (anonimizar en ingesta: quedarse con inmueble, precio, fecha); (b) direcciones exactas + precios vinculables a personas físicas vendedoras — tratar como dato personal potencial; (c) los leads del widget de valoración (consentimiento explícito, base de legitimación, derecho de supresión). Nada de esto bloquea el producto; es diseño de esquema y consentimientos.
- **Estándares como argumento de venta, no obligación:** ESSVM de la EAA (FSD por valoración, backtesting continuo) y RICS Red Book 2025 (VPS 5: el output de un AVM solo es "valoración" con juicio profesional humano) → el diseño human-in-the-loop (el agente revisa y ajusta antes de firmar el informe) es exactamente lo que la profesión exige.

---

## 6) Recomendación de MVP: qué construir primero y con qué datos

**Beachhead: residencial urbano + naves en Cataluña/AMB**, porque ahí coinciden (a) el socio y sus datos, (b) las mejores fuentes públicas de España (SIPAE, Naus i Solars, Open Data BCN, Incasòl), y (c) el hueco industrial sin competencia.

**Fase 0 — en paralelo, esta semana (no bloquea nada):**
- Solicitar acceso a la API de Idealista (developers.idealista.com) — tarda y la doc solo llega por email.
- Pedir presupuesto a idealista/data, CASAFARI, DataVenues y Brainsre — el coste de datos condiciona el pricing.

**Fase 1 — MVP con datos 100% gratuitos + datos del socio (4–6 semanas de alcance):**
1. **Importador de cartera del socio:** CSV/XLSX + XML estándar de CRMs inmobiliarios → normalización → esquema "comparable" en Supabase (PostGIS activado). Sus **precios de cierre** son el moat; tratarlos como fuente de máxima fiabilidad.
2. **Pipeline de zona:** ETL batch de ADRH por sección censal + SERPAVI + Registradores (provincia) + MIVAU (municipio) + Open Data BCN (barrio). Nota operativa: MIVAU, Registradores y CBRE bloquean fetches automatizados — documentar proceso semi-manual de descarga trimestral/anual.
3. **Enriquecimiento por inmueble:** Catastro OVC on-demand (superficie, año, uso) con caché.
4. **Motor residencial v1:** LightGBM sobre comparables del socio + calibración con capas públicas; output = valor + horquilla + confidence (nº/calidad de comps) + **línea explícita "ajuste por renta de zona: ±X%"** + mínimo 6 testigos mostrados; rehusar/degradar con pocos comps.
5. **Módulo naves v1 (semi-manual, el diferenciador):** ficha de nave con features industriales + contexto de polígono (SIPAE) + tres métodos reconciliados (comparables del socio + Naus i Solars, capitalización con yields CBRE/JLL, coste de reposición ATC) → horquilla amplia + desglose por método.
6. **Informe PDF white-label** con logo de la agencia + disclaimer legal ("valoración orientativa, no sustituye la tasación oficial ECO/805") en todos los outputs.
7. **Pricing público self-service** (3 tiers, 49–199 €/mes, trial 14 días) — diferenciador de mercado por sí mismo.

**Fase 2 — cuando lleguen respuestas comerciales:** integrar UN agregador de comparables tras la interfaz de adapter (empezar por el que mejor presupuesto dé; diseñar para poder cambiar idealista/data ↔ CASAFARI ↔ DataVenues sin tocar el motor), añadir ajuste listing-to-close por zona, y publicar MdAPE/PPE10 por backtesting como argumento de venta.

**Qué NO construir en el MVP:** scraping de portales como pipeline (riesgo legal y fragilidad), AVM point-estimate para naves (metodológicamente indefendible — siempre horquilla), tasación "oficial" o cualquier lenguaje que la sugiera, computer vision sobre fotos (mejora de mayor ROI para v2, no para v1), y cobertura nacional de industrial desde el día uno (fuera de Cataluña no existe la capa de datos de polígono; expandir después con el Mapa de Suelo Industrial del CNIG).

**El posicionamiento en una frase:** *la única herramienta con precios públicos que valora pisos Y naves con datos de cierre reales y te explica cuánto pesa el barrio en el precio — orientativa por diseño, con derivación a tasadora homologada cuando haga falta.*
