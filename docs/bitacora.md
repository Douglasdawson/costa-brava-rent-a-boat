# Bitacora (relato fechado movido de CLAUDE.md)

Contexto e historia detras de las reglas de `CLAUDE.md`. Texto copiado tal cual; la regla vigente vive en CLAUDE.md.

## Politica de cancelacion y suspension por mal tiempo (decision del dueno 2026-11-06)

Politica de cancelacion (decision del dueno 2026-11-06): si la EMPRESA suspende por mal tiempo, el cliente elige SIEMPRE entre nueva fecha, bono de 12 meses o devolucion integra, con o sin garantia. La Garantia de mal tiempo (cobertura opcional del paso 5 del wizard) cubre otra cosa: que el CLIENTE cancele por su cuenta con devolucion integra (menos la garantia) si la prevision AEMET de la vispera da aviso costero o >=15 nudos, aunque la empresa saldria. Texto canonico: `CANCELLATION_POLICY_ES` y `CANCELLATION_TERMS_BULLETS_ES` en `shared/businessProfile.ts`; cualquier surface nueva los referencia en vez de copiar. Desarrollo publico en `t.garantiasPage` (`/garantias`) y clausula 7 de `t.legalPages.terms`.

Criterio de suspension = aviso costero oficial de AEMET para la zona en la franja horaria del alquiler, viento sostenido o rachas por encima de 20 nudos, o decision del personal por seguridad (`garantiasPage.criteria`). El umbral de la garantia (vispera, 15 nudos) es otro y no se mezcla con el de suspension. NUNCA volver a "sin garantia solo bono, no se devuelve en dinero": es clausula abusiva frente a consumo. La Garantia de mal tiempo y la Fianza reducida son garantias comerciales, NUNCA un seguro, en ningun idioma.

Retraso en la devolucion: tarifa horaria vigente del barco +50 % por cada fraccion de 30 minutos (barcos sin precio de 1 h: la mitad del de 2 h). Nunca un importe fijo desproporcionado.

## RD 1188/2025: fin del alquiler sin titulacion y pivote a titulacion

**RD 1188/2025 (BOE 30-dic-2025): fin del alquiler sin titulacion.** Desde el **1-oct-2026** el arrendatario de cualquier embarcacion a motor debe tener titulo nautico: la exencion 5m/15CV del RD 875/2014 queda restringida al uso privado. Hasta el 30-sep-2026 la oferta "sin licencia" es legal y NO se toca (temporada alta). Reglas para copy nuevo: (1) cualquier texto que prometa "alquiler sin licencia" lleva marco temporal ("hasta el 30-sep-2026") o el framing nuevo "titulin en 1 dia"; (2) la promesa "con el titulin llevas la flota" cubre **los tres barcos con licencia**, y eso ya no tiene asterisco: el "625" del Pacific Craft es nombre comercial y su eslora de **matriculacion son 5,90 m** (arbitrado con el owner el 22-sep-2026; la fuente es la documentacion de matriculacion, via crmdamar). Hasta ese dia la ficha decia 6,24 m *y* "Requiere Licencia de Navegacion (LN) o superior" en la misma frase, o sea que dejaba al cliente fuera de su propia titulacion, y 32 frases en 8 idiomas listaban solo la Mingolla y la Trimarchi como cubiertas. **Nunca infieras una eslora del nombre del modelo**, que es de donde salio el 6,24. `shared/gemela.test.ts` lo guarda contra la web de la escuela; (3) pagina pilar `/es/licencia-navegacion-titulin` (clave i18n `navigationLicensePage`, 8 idiomas) + post `fin-alquiler-barcos-sin-licencia-2026` + FAQ `normativa2026`/`titulin` + facts `license-free-rental-end-date`/`navigation-license-course`. **Pivote de posicionamiento hecho el 2026-08-16** (adelantado a peticion del owner, no en octubre): la home, su SEO y toda la capa GEO ya lideran con titulacion. El copy dual (titulacion primero + oferta sin licencia datada) NO se gobierna con un feature flag sino con `isLicenseFreeEraActive()` de `shared/constants.ts`, funcion pura sobre `LICENSE_FREE_LAST_DAY = "2026-09-30"` en zona Europe/Madrid: el 1-oct el mensaje se apaga solo. Lo consumen `Hero.tsx` (franja bajo los CTA) y `LicenseComparisonSection.tsx` (banda bajo las 3 cards).

⚠️ **El 1-oct-2026 hay que REDESPLEGAR aunque no cambie ni una linea de codigo** para que el copy datado se regenere.


## Lo que esta web publica de la escuela nautica hermana, y los dos guardianes

🔴 **Lo que esta web publica de la escuela nautica hermana, y los dos guardianes que lo vigilan**
(22-sep-2026, primer cruce con `escolanauticablanes`). **Esta es la web que rankea**, asi que lo que
diga de la escuela se publica con autoridad que la escuela todavia no tiene — y parte va dirigida
explicitamente a los crawlers de IA por `/api/ai-context`. Tres reglas, y las tres nacen de una
falsedad que estuvo publicada:

- **Nada en PRESENTE.** El nodo `EducationalOrganization` de `server/routes/robots.ts` decia
  «Imparte la Licencia de Navegacion» / «Teaches the…» con el AGR163 sin resolver. Se autocorregia
  dos clausulas despues, pero un extractor que se quede con el primer predicado publica la frase
  falsa. Futuro siempre: «Impartira» / «Will teach», con el estado delante.
- **Ninguna FECHA DE APERTURA.** La escuela retiro «abril de 2027» de su propia web a proposito
  —depende de una resolucion que no controlamos— y aqui seguia en una veintena de sitios. El
  calendario interno sigue vivo en `docs/` de la escuela; lo que no sale es la promesa publica.
- **Ningun precio que la escuela no publique.** Ni el del curso ni el del reconocimiento psicofisico
  (el «~45 €» que circula es de fuente secundaria y ella lo documenta en dos sitios). El que se
  publicaba aqui, ademas, la encerraba por arriba en temporada alta.

Los dos guardianes: `shared/escolaNauticaLinks.test.ts` —que ya prohibia lenguaje de venta pero
**no cubria `robots.ts`**, que es justo donde estaba el bug— y `shared/gemela.test.ts`, que cruza
las cifras compartidas leyendo los ficheros de la hermana **del disco** y se salta la prueba si no
estan (en el contenedor no estan). No es un import entre repos y no puede serlo: se despliegan por
separado. La hermana tiene el suyo, espejo de este, y hacen falta los dos porque quien trabaja aqui
ejecuta estos tests y no los de alla.

## El deploy NO arregla el contenido YA PUBLICADO en la BD

⚠️ **Y lo que el deploy NO arregla: el contenido YA PUBLICADO vive en la BD.** Las fichas de barco
salen de `/api/boats` (la tabla `boats`, con su `specifications->>'length'`) y los posts de
`blog_posts`; `applyBoatsSeedEnsure` es `ON CONFLICT DO NOTHING`, asi que **nunca pisa una fila que
ya existe**. Corregir `shared/boatData.ts` o `server/seeds/blogSeed.ts` cambia lo que se sembrara,
no lo que esta sembrado. La descripcion SI se salva sola porque la pantalla usa
`t.boatDescriptions[boatId] || boatData.description` y el i18n gana; la **eslora no**, y es la que
se lee en la ficha.

## Prerender: NO corre en produccion, y es a proposito (verificado 2026-08-16)

Coolify tiene `build_command = "npm run build"`, que **arranca borrando `dist/prerendered`** y nunca llama al prerender. Es decir: **produccion no tiene snapshots y sirve siempre el shell SSR de `seoInjector`** con su `bodyFallback`. Toda la maquinaria de prerender (`scripts/prerender.ts`, `prerenderedMiddleware`, el guard de frescura) esta montada pero inactiva.

**No lo "arregles" cambiando el build command a `build:deploy`.** `scripts/prerender.ts` levanta el servidor real (`node dist/index.js`) para rastrearlo, y `server/config.ts` valida con Zod que existan `DATABASE_URL`, `JWT_SECRET` y `ADMIN_PIN`. En Coolify hay **0 variables marcadas como build-time**, asi que el prerender siempre fallaria al arrancar; activarlo obligaria a exponer la connection string de Neon PROD y el JWT secret en la capa de build de la imagen. No compensa.

**Consecuencia practica:** el `bodyFallback` de `resolveMeta` NO es una red de seguridad, es **lo unico que ven los crawlers sin JS** (GPTBot, ClaudeBot, PerplexityBot y buena parte de los bots sociales). Al tocar el copy de una pagina, el bodyFallback es tan importante como el JSX: si un enlace o un hecho solo existe tras hidratar, para esos bots no existe. Por eso el de la home enlaza explicitamente a barcos-con-licencia, al titulin y a la excursion con patron.
