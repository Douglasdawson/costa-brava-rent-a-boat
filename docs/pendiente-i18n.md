# Deuda i18n pendiente (movida de CLAUDE.md)

Los siguientes archivos **todavía tienen texto visible en español hardcoded** en JSX que no se propaga al cambiar a otros idiomas. Migrar a `es.ts` + `npm run i18n:translate` cuando se toquen:

| Archivo | Qué mover | Tamaño |
|---------|-----------|--------|
| `client/src/pages/faq.tsx` | Los `AccordionItem` del body (contenido narrativo rico con listas, CTAs, botones, notas internas). El JSON-LD schema YA está en i18n vía `t.faqPage.items`; los Accordion siguen hardcoded pero Google solo lee el schema. | Grande (~3h) |
| Páginas de ubicación (todas) — props `title`/`description` de `<PopularBoatsSection>` | Cross-cutting: el heading + intro de la sección "Barcos populares" se pasan como literales en español en `location-tordera/palafolls/pineda/barcelona/tossa/lloret.tsx`. El componente espera strings ya localizados; hay que crear claves i18n por página y pasarlas. | Pequeño (~30min total) |
| `client/src/components/FAQPreview.tsx` | `FALLBACK_ITEMS` (8 Q&A — ya hay `t.faqPreview?.items` como override que cubre los 8 idiomas; el fallback solo se mostraría si algún idioma perdiera los items) | Pequeño (safety-net, baja prioridad) |

**Ya migrados (100 % vivos):**
- `pricing.tsx` → `t.pricingPage` (54 claves)
- `category-licensed.tsx` → `t.categoryLicensed`
- `faq.tsx` JSON-LD schema + hero + categorías → `t.faqPage` (92 claves)
- `location-barcelona.tsx` → `t.locationBarcelona` (41 claves)
- `location-tossa-de-mar.tsx` warning + cross-links + related → `t.locationPages.tossa.sections` (9 claves nuevas)
- `location-lloret-de-mar.tsx` cross-links + related → `t.locationPages.lloret.sections` (6 claves nuevas)
- `location-malgrat-de-mar.tsx` / `santa-susanna.tsx` / `calella.tsx` → FAQ placeholders procesados por `LocationTemplate`. **Indexados en los 8 idiomas desde 2026-06-16**: añadidos a `server/seo/translatedStaticPaths.ts` y con cuerpo SSR nativo por idioma en `seoInjector.ts` (lee `t.locationPages.{malgrat|santaSusanna|calella}.hero/sections`), igual que tordera/palafolls/pineda. Antes solo indexaban ES (noindex + canonical→ES fuera de ES)
- `location-tordera.tsx` / `location-palafolls.tsx` / `location-pineda-de-mar.tsx` → cuerpo completo vía `t.locationPages.<town>.sections` + `faqItems` (i18n-complete en los 8 idiomas, confirmado 2026-05-29; ver `server/seo/translatedStaticPaths.ts`). Pendiente solo las props de `PopularBoatsSection` (arriba)

Cuando añadas texto nuevo a cualquiera de los archivos pendientes, **aprovecha para migrarlo al sistema i18n** en el mismo commit.
