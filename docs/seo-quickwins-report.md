# SEO Quick Wins Report — Google Search Console

**Periodo:** 19 dic 2025 — 19 mar 2026 (90 dias)
**Total impresiones:** ~12,728 (www) + ~1,041 (non-www) = ~13,769
**Total clicks:** ~92 (homepage) + dispersos en paginas antiguas Wix

---

## Problemas Tecnicos Criticos

### 1. www vs non-www: Impresiones divididas
Google indexa AMBOS dominios por separado:
- `www.costabravarentaboat.com` → 12,728 impresiones, 76 clicks
- `costabravarentaboat.com` → 1,041 impresiones, 16 clicks

**Impacto:** Las senales SEO se dividen entre dos versiones. Necesita redirect 301 de www → non-www (o viceversa) + canonical coherente.

### 2. Homepage canibaliza todas las queries
Las paginas de ubicacion dedicadas (`/alquiler-barcos-blanes`, `/alquiler-barcos-lloret-de-mar`) NO aparecen en los resultados de GSC. Solo la homepage rankea para queries como:
- "alquiler barco blanes" → homepage pos 9.1
- "alquiler barco lloret de mar" → homepage pos 7.3
- "alquiler de barco en costa brava" → homepage pos 4.7

**Causa probable:** Google aun no ha indexado las paginas de ubicacion, o las considera duplicadas de la homepage.

### 3. URLs antiguas de Wix aun indexadas
Paginas del sitio Wix antiguo siguen recibiendo impresiones:
- `/fuegos-artificiales-blanes-2025` → 1,457 impr, 5 clicks
- `/barco-sin-licencia-blanes-astec-450` → 446 impr, 3 clicks
- `/barco-sin-licencia-blanes-astec-400` → 635 impr, 1 click

Estas deberian estar redirigidas (301) y ya lo estan, pero Google sigue mostrando las URLs antiguas.

---

## Categoria A: Primera Pagina, CTR Bajo (pos 4-10, impr>20, CTR<5%)

Estas queries estan en primera pagina pero NO generan clicks. El title/description de la homepage no convence.

| Query | Impr | Clicks | CTR | Pos | Pagina |
|-------|------|--------|-----|-----|--------|
| alquiler barco blanes | 326 | 1 | 0.3% | 9.0 | homepage |
| alquiler barco lloret de mar | 224 | 0 | 0% | 7.4 | homepage |
| alquiler de barco en costa brava | 223 | 1 | 0.4% | 4.8 | homepage |
| astec 400 | 220 | 0 | 0% | 7.8 | /barco-sin-licencia-blanes-astec-400 |
| rent boat costa brava | 200 | 0 | 0% | 9.3 | homepage |
| alquiler barcos blanes | 177 | 0 | 0% | 9.4 | homepage |
| alquiler barco sin licencia lloret de mar | 165 | 0 | 0% | 5.1 | homepage |
| alquilar barco blanes | 144 | 0 | 0% | 8.6 | homepage |
| alquiler embarcaciones costa brava | 121 | 0 | 0% | 4.8 | homepage |
| alquiler barca blanes | 102 | 0 | 0% | 8.4 | homepage |
| alquiler barco en costa brava | 99 | 0 | 0% | 5.9 | homepage |
| costa brava rent boat | 98 | 1 | 1% | 4.3 | homepage |
| barco alquiler costa brava | 97 | 0 | 0% | 6.2 | homepage |
| alquilar barco en costa brava | 84 | 0 | 0% | 7.0 | homepage |
| costa brava boat | 69 | 1 | 1.4% | 8.6 | homepage |

**Total impacto potencial: ~2,349 impresiones con 0-1% CTR → mejorar title podria generar 50-100 clicks/mes**

### Accion: Mejorar title y meta description de la homepage

**Title actual:**
`Alquiler Barcos Blanes Sin Licencia | Puerto de Blanes desde 70€/h`

**Problema:** No menciona "Costa Brava" que es la query #1 con 725+ impresiones. Solo dice "Blanes".

**Title propuesto:**
`Alquiler Barcos Costa Brava | Sin Licencia desde 70€/h | Blanes`

**Description actual:**
`Alquiler barcos Blanes sin licencia desde 70€/h. Gasolina incluida, parking gratis. Elige 2h, 4h, 6h u 8h. 4.8★ Google (300+ opiniones). Reserva online al instante.`

**Description propuesta:**
`Alquiler de barcos en Costa Brava desde 70€/h con gasolina incluida. Sin licencia ni experiencia. Blanes, Lloret, Tossa de Mar. 4.8★ Google (300+ opiniones). Reserva hoy.`

---

## Categoria B: Segunda Pagina (pos 11-20, impr>15)

Queries en segunda pagina con alto volumen. Un empujon de contenido o internal linking las lleva a primera pagina.

| Query | Impr | Pos | Accion |
|-------|------|-----|--------|
| alquiler barco costa brava | 725 | 13.2 | PRIORIDAD 1 — Reforzar /alquiler-barcos-costa-brava |
| alquiler barcos costa brava | 363 | 12.7 | Misma pagina, variante plural |
| alquilar barco costa brava | 233 | 13.1 | Misma pagina, variante infinitivo |
| location bateau blanes | 172 | 14.6 | Crear/optimizar version FR de Blanes |
| alquiler de barcos costa brava | 145 | 13.8 | Misma pagina costa brava |
| alquiler lancha costa brava | 140 | 12.2 | Variante "lancha" → misma pagina |
| location bateau journee blanes | 126 | 15.3 | Version FR de Blanes, "por dia" |
| alquiler barco sin licencia platja d'aro | 119 | 19.3 | No tenemos pagina Platja d'Aro |
| excursiones grupo costa brava con patron | 116 | 11.3 | Reforzar /barcos-con-licencia |
| alquiler barco blanes sin licencia | 106 | 13.0 | Reforzar /alquiler-barcos-blanes |
| alquiler barco tossa de mar | 101 | 16.0 | Reforzar /alquiler-barcos-tossa-de-mar |

### Internal linking recomendado:
- Homepage → /alquiler-barcos-costa-brava (anchor: "alquiler barco costa brava")
- Homepage → /alquiler-barcos-blanes (anchor: "alquiler barco blanes")
- Homepage → /alquiler-barcos-tossa-de-mar (anchor: "alquiler barco tossa")
- Blog posts → paginas de ubicacion relevantes
- /barcos-sin-licencia → /alquiler-barcos-costa-brava

---

## Categoria C: CTR Killers (pos 1-3 pero CTR 0%)

Queries donde rankamos top 3 pero nadie clicka. Mayormente queries irrelevantes (fuegos artificiales) o muy genericas.

| Query | Impr | Pos | Relevante? |
|-------|------|-----|-----------|
| fuegos artificiales blanes | 112 | 3.5 | NO — blog post sobre fuegos, no barcos |
| fuegos artificiales de blanes | 22 | 1.0 | NO — idem |
| feu d'artifice roses espagne 2025 | 29 | 1.8 | NO — buscan fuegos en Roses, no barcos |
| feu d'artifice empuriabrava 2025 | 22 | 2.2 | NO — buscan fuegos en Empuriabrava |
| feu d'artifice platja d'aro 2025 | 18 | 1.6 | NO — buscan fuegos en Platja d'Aro |
| car hire blanes | 15 | 1.0 | NO — buscan alquiler de COCHE |
| fiesta blanes | 11 | 1.2 | NO — buscan fiestas locales |
| focs de blanes 2026 | 11 | 1.0 | NO — fuegos en catalan |

**Accion:** No invertir esfuerzo en estas. Son queries irrelevantes donde el blog de fuegos artificiales rankea por accidente. No generan negocio.

---

## Categoria D: Contenido que Falta

Queries con impresiones altas donde no tenemos pagina dedicada o rankea muy bajo.

| Query | Impr | Pos | Oportunidad |
|-------|------|-----|-------------|
| alquiler barco sin licencia | 550 | 26.1 | Pagina generica "sin licencia" (ya existe /barcos-sin-licencia pero no rankea) |
| alquiler boyas costa brava | 389 | 48.2 | Tema diferente (boyas de fondeo), no relevante |
| lloguer vaixell costa brava | 117 | 22.5 | Optimizar version CA de costa-brava |
| alquiler barco sin licencia platja d'aro | 119 | 19.3 | Crear pagina Platja d'Aro (cercano a Blanes) |
| location bateau costa brava | 142 | 70.4 | Optimizar version FR de costa-brava |
| location bateau lloret de mar | 119 | 43.8 | Optimizar version FR de lloret |

---

## Top 10 Oportunidades por Impacto Estimado

| # | Accion | Impresiones afectadas | Impacto estimado |
|---|--------|----------------------|-----------------|
| 1 | **Resolver www vs non-www** (redirect 301) | 13,769 | Consolidar senales SEO |
| 2 | **Optimizar title homepage** para "Costa Brava" | 2,349+ | +50-100 clicks/mes |
| 3 | **Indexar /es/alquiler-barcos-costa-brava** correctamente | 1,321 | Dejar de canibalizar homepage |
| 4 | **Indexar /es/alquiler-barcos-blanes** correctamente | 749 | Pagina dedicada deberia rankear mejor |
| 5 | **Indexar /es/alquiler-barcos-lloret-de-mar** | 345 | Pagina dedicada para Lloret |
| 6 | **Optimizar /es/barcos-sin-licencia** | 550 | Keyword con alto volumen |
| 7 | **Crear pagina Platja d'Aro** | 119 | Destino cercano con demanda |
| 8 | **Optimizar paginas FR** (location-bateau-*) | 559 | Mercado frances con demanda real |
| 9 | **Indexar /es/alquiler-barcos-tossa-de-mar** | 142 | Pagina dedicada para Tossa |
| 10 | **Optimizar version CA** (lloguer-vaixell-*) | 117+ | Mercado local catalan |
