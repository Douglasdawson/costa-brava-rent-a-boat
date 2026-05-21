# Fase 2 SEO · Análisis SERP top 5 (2026-05-18)

Adelantado 5 días al checkpoint del 2026-05-23 para tener el plan listo cuando lleguen los datos del SQL post-Fase 1.

## Contexto

Fase 1 (commit `f147e01`, deploy 2026-05-09) reescribió titles + meta descriptions de todas las homes idiomáticas + landings clave. Tras 9 días, el snapshot del 17-may mostró:

- CTR global plano (1,48% → 1,49%) pese a +31% clicks y +31% impresiones
- Posición media mejorada (15,07 → 13,68)
- Queries genéricas siguen sin convertir; queries brand-match dispararon CTR

Resto del trabajo SEO desde entonces (Palancas 1+2 + zombies): `1b967f4` (Footer rich anchors), `d7b8ecb` (Home expanded internalLinks), `c479ba9` (zombies). Total commits SEO desde Fase 1: 4.

## SERP top 5 de las 3 queries clave

### Query 1: `alquiler barco costa brava` (885 imp, pos 9,71)

| # | URL | Tipo |
|---|---|---|
| 1 | clickandboat.com/es/alquiler-barcos/espana/costa-brava | Marketplace |
| 2 | palamosboats.com | Operador (Palamós) |
| 3 | tripadvisor.es/Attractions...Costa_Brava | Directorio |
| 4 | **costabravarentboat.com** | Competidor con nombre confuso |
| 5 | costabravaboats.com | Operador |

Costa Brava Rent a Boat (nosotros) NO aparece en top 10 que devuelve Firecrawl.

### Query 2: `rent boat costa brava` (217 imp, pos 11,91)

| # | URL | Tipo |
|---|---|---|
| 1 | tripadvisor.com/Attractions...Costa_Brava | Directorio EN |
| 2 | clickandboat.com/us/boat-rental/spain/costa-brava | Marketplace EN |
| 3 | samboat.com/boat-rental/costa-brava-spain | Marketplace EN |
| 4 | costabravayacht.com | Operador EN |
| 5 | hotelaiguablava.com/en/...aiguablava-charter-boats | Hotel + servicio |

NOSOTROS no aparecemos. Mercado EN dominado por marketplaces internacionales.

### Query 3: `alquiler barco sin licencia costa brava` (97 imp, pos 13,64 según SQL, pero 4 según SERP en vivo)

| # | URL | Tipo |
|---|---|---|
| 1 | clickandboat.com/es/alquiler-barcos-sin-licencia/costa-brava | Marketplace |
| 2 | nautal.com/es/alquiler-barcos-sin-licencia/costa-brava | Marketplace |
| 3 | estartitrentaboat.com/es/alquiler-de-embarcaciones-sin-licencia | Operador |
| 4 | **costabravarentaboat.com/es/** | NOSOTROS ✅ |
| 5 | palamosboats.com/barcas/ | Operador |

**Estamos en top 5.** Pero atrapados detrás de marketplaces.

## Diagnóstico estratégico

### 1. Marketplaces y directorios son inalcanzables

Click&Boat tiene 1641 barcos en su listado de Costa Brava. SamBoat 440. Nautal cientos. Su autoridad de dominio + cobertura de inventario les da pos 1-3 en queries genéricas.

**TripAdvisor** aparece pos 3 en ES y pos 1 en EN — el listado "Top 10 alquileres" tiene un peso brutal.

Pelear posiciones 1-3 contra ellos sin construir contenido masivo + backlinks de alta autoridad es **ROI negativo**.

### 2. Nuestro nicho defendible es "sin licencia + Blanes"

- Para "alquiler barco sin licencia costa brava" ya estamos pos 4
- Para "alquiler barco blanes" estamos pos 6,59 (CTR 3,87% — el rewrite funcionó)
- Para "alquilar barco blanes" estamos pos 6,99
- Para "boot huren blanes" (NL) estamos pos 17 pero con CTR 4,55%

Nuestras ventajas estructurales en este nicho:
- 8 barcos sin licencia desde 70€/h con gasolina incluida (precio competitivo)
- Único operador con 8 idiomas + WhatsApp AI 24/7
- 4,8★ 310 reseñas (más que la mayoría de operadores locales)
- Excursión privada con patrón empaquetada
- Ubicación: Puerto de Blanes (extremo sur Costa Brava, cerca de Barcelona)

### 3. Google ignora nuestro meta description en queries específicas

En "alquiler barco sin licencia costa brava" pos 4, el snippet visible es:

> "Mayor flota de alquiler de barcos del Puerto de Blanes (9 barcos). Sin licencia desde 70€/h con gasolina incluida. Barcos con licencia y excursión privada con..."

Eso es texto del **body** de la página, no nuestro meta description. Google decide: "el meta description es genérico para esta query, voy a usar texto extraído del body que sea más específico".

**Implicación**: optimizar los primeros párrafos del body de `/es/` y `/es/barcos-sin-licencia` tiene tanto o más impacto que el meta description.

## Plan reorientado para Fase 2

Tres palancas, ordenadas por ROI:

### Palanca 2.1 · Reforzar `/es/barcos-sin-licencia` (alta prioridad)

Página `categoryLicenseFree`. Hoy en pos 27-29 (SQL del 17-may). El nicho "sin licencia" es nuestro mejor terreno. Acciones:

- **Title/meta**: ya reescritos en Fase 1, mantener.
- **Body**: añadir al hero un párrafo de 60-80 palabras con keyword-rich que Google pueda extraer cuando ignore el meta description. Incluir: "alquiler barco sin licencia costa brava", "sin carnet", "sin titulación", "sin experiencia previa", "hasta 5 personas", "Puerto de Blanes".
- **Secciones nuevas**: FAQ schema con 5-6 preguntas long tail ("¿Necesito carnet?", "¿Cuánta gente cabe?", "¿Qué pasa si no he conducido nunca?"). Cada respuesta 50-80 palabras.
- **Internal linking**: ya enlaza a Blanes/Lloret/Tossa (línea 678-686 del componente). OK.

### Palanca 2.2 · Reforzar `/es/alquiler-barcos-blanes` (alta prioridad)

Página `locationBlanes`. Hoy en pos 27,89 según SQL del 9-may. Aunque la query "alquiler barco blanes" ya está en pos 6,59 (es la home `/` la que rankea), si subimos esta landing local específica, podemos capturar variantes long tail: "alquiler barco puerto de blanes", "barco sa palomera blanes", "amarre blanes barco", etc.

Acciones similares a 2.1.

### Palanca 2.3 · Optimizar body de `/es/` (media prioridad)

Hero de la home idiomática debe incluir texto SEO-friendly en los primeros 2 párrafos. Sin sacrificar UX. Si Google ignora el meta description, que extraiga algo bueno.

### Palanca 2.4 · NO perseguir queries genéricas dominadas por marketplaces

Específicamente NO invertir esfuerzo en:
- "alquiler barco costa brava" (top 3 = Click&Boat, Palamós, TripAdvisor)
- "rent boat costa brava" (top 3 = TripAdvisor, Click&Boat, SamBoat)
- "alquiler barcos costa brava" (mismo SERP que la anterior)

Mantener la posición actual (pos 9-11) sin más inversión. El ROI marginal es bajo.

### Palanca 2.5 · Mejorar perfil en TripAdvisor (externo, requiere acción manual)

TripAdvisor está en pos 3 ES y pos 1 EN para nuestras queries top. Si nuestro perfil ahí está en top 3 del listado, ganamos visibilidad gratis. Acción manual del usuario: revisar perfil, añadir fotos recientes, responder a reviews, completar campos.

NO bloquea el trabajo en código.

## Próximos pasos concretos

Empezar por **Palanca 2.1** (reforzar `/es/barcos-sin-licencia`):

1. Leer `client/src/pages/category-license-free.tsx` y identificar dónde añadir el hero paragraph + FAQ schema
2. Texto nuevo a `client/src/i18n/es.ts` (claves nuevas en `t.categoryLicenseFree` o similar)
3. Propagación manual a 7 idiomas (API key Anthropic expirada)
4. TS check + commit + push

ETA: 2-3 horas si va limpio.

## Datos crudos del SERP

Guardados en este briefing por si los necesitamos al planificar otras queries más tarde. No commitear (briefings/ está en .gitignore).
