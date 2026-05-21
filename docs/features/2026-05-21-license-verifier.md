# Verificador de licencia náutica

**Fecha**: 21 de mayo de 2026
**Estado**: TIER 1 + TIER 2 entregados. TIER 3 #1 (service worker), #3 (offline awareness) y #6 (keyboard nav a11y) entregados el mismo día. Resto de TIER 3 pendiente.
**Owner técnico**: equipo CTO

## Por qué existe

Clientes extranjeros que reservan barcos con licencia no saben si su título nacional sirve en España. Eso genera ida y vuelta de mails con el equipo de Blanes y, en el peor caso, expectativas rotas el día del alquiler. El verificador les permite auto-orientarse antes de enviar la solicitud y, en paralelo, captura el dato para que el equipo lo vea ya en el CRM.

Filosofía: **orientar, no bloquear**. La verificación es opcional. La solicitud se envía igual cualquiera que sea el veredicto, manteniendo el modelo de inquiries flexibles del wizard.

## Marco legal vigente

- **Norma de referencia**: Real Decreto 875/2014, de 10 de octubre. <https://www.boe.es/eli/es/rd/2014/10/10/875>
- La Orden FOM/3200/2007 (BOE-A-2007-19071) está **derogada** desde el 11 de enero de 2015 — el verificador nunca cita esta orden.
- La Marina Mercante **no publica** una tabla oficial de equivalencias por país. Cualquier "≈ PNB" en el verificador es interpretación orientativa basada en reciprocidad EU + ICC (UN/ECE Resolución 40), no derecho positivo.
- Disclaimer obligatorio en cada vista del verificador: *"Información orientativa basada en el Real Decreto 875/2014. La autorización final depende de la Capitanía Marítima."*

## Arquitectura

```
shared/
  nauticalLicenseRules.ts          ← lógica pura: catálogo + verifyLicense
  nauticalLicenseRules.test.ts     ← 49 tests
  schema.ts                        ← whatsappInquiries con 5 campos nuevos
                                     (licenseCountry, licenseType,
                                      hasIcc, licenseVerificationStatus,
                                      licenseSpanishEquivalent)

client/src/hooks/
  useLicenseVerifier.ts            ← estado: country/licenseCode/hasIcc/
                                     status/spanishEquivalent/meetsFleetMinimum/
                                     dismissed; acciones setCountry, verify,
                                     resetStatus, dismiss, hydrate

client/src/utils/
  license-countries.ts             ← 58 países (ISO-2) + Intl.DisplayNames

client/src/components/booking/
  LicenseVerifierPanel.tsx         ← UI principal, mobile-first + bottom-sheet
  LicenseVerifierPanelSkeleton.tsx ← placeholder para React.lazy
  LicenseStatusPill.tsx            ← chip resumen usado en Step 5

client/src/components/
  BookingWizardMobile.tsx          ← integra panel con Suspense
  BookingFormDesktop.tsx           ← idem

client/src/components/crm/
  InquiriesTab.tsx                 ← muestra licencia + equivalencia + badge

client/src/i18n/
  {es,en,ca,fr,de,nl,it,ru}.ts     ← bloque licenseVerifier traducido a 8 idiomas

server/routes/
  inquiries.ts                     ← acepta los 5 campos (sin lógica extra)
```

## Decisión: catálogo curado vs equivalencias inventadas

**Sólo se afirman equivalencias respaldadas**:
- 8 países curados a mano (ES, FR, IT, DE, GB, PT, NL, BE) con sus títulos nacionales reales.
- ICC vía UN/ECE Res. 40 — equivalente a PER por reciprocidad.

**Resto del mundo** (US, AU, JP, MX…): solo se ofrecen ICC + Otra. **No** se inventa "≈ PNB" para licencias que no conocemos. Si el cliente pulsa Otra + ICC=No, el resultado es `not_recognized` con CTA WhatsApp para escalamiento humano.

Decisión documentada el 2026-05-21 tras feedback explícito del usuario: *"no sabemos en Australia la licencia náutica de su país es igual al PNB español"*.

## Catálogo curado (orientativo)

| País | Título | Equivalente ES |
|---|---|---|
| 🇪🇸 ES | PNB | PNB |
| 🇪🇸 ES | PER | PER |
| 🇪🇸 ES | Patrón de Yate | Patrón de Yate |
| 🇪🇸 ES | Capitán de Yate | Capitán de Yate |
| 🇫🇷 FR | Permis Côtier | PNB |
| 🇫🇷 FR | Permis Hauturier | PER |
| 🇮🇹 IT | Patente entro 12 miglia | PNB |
| 🇮🇹 IT | Patente oltre 12 miglia | PER |
| 🇮🇹 IT | Patente senza alcun limite | Patrón de Yate |
| 🇩🇪 DE | SBF See | PNB |
| 🇩🇪 DE | SKS | PER |
| 🇩🇪 DE | SSE | Patrón de Yate |
| 🇩🇪 DE | SHS | Capitán de Yate |
| 🇬🇧 GB | RYA Powerboat 2 | PNB |
| 🇬🇧 GB | RYA Day Skipper | PER |
| 🇬🇧 GB | RYA Coastal Skipper | Patrón de Yate |
| 🇬🇧 GB | RYA Yachtmaster | Capitán de Yate |
| 🇬🇧 GB | ICC | PER |
| 🇵🇹 PT | Marinheiro / Patrão Local | PNB |
| 🇵🇹 PT | Patrão de Costa | PER |
| 🇵🇹 PT | Patrão de Alto Mar | Patrón de Yate |
| 🇳🇱 NL | Klein Vaarbewijs II | PNB |
| 🇳🇱 NL | Groot Pleziervaartbewijs | PER |
| 🇧🇪 BE | Beperkt Stuurbrevet | PNB |
| 🇧🇪 BE | Algemeen Stuurbrevet | PER |
| 🇧🇪 BE | Yachtman Brevet | Patrón de Yate |

**Fleet min**: PNB (la flota actual va de LBN/PNB a PER/PNB, ver `shared/boatData.ts`). Cualquier equivalente ≥ PNB → válido para los barcos con licencia.

## Pre-relleno por idioma

`LANGUAGE_TO_DEFAULT_COUNTRY` en `shared/nauticalLicenseRules.ts`:

| Idioma URL | País preseleccionado |
|---|---|
| es / ca | ES |
| en | GB |
| fr | FR |
| de | DE |
| nl | NL |
| it | IT |
| ru | RU |

Aplica solo en el primer mount del panel cuando `state.country === ""`. Respeta cualquier país previo guardado en sessionStorage.

## i18n

- Claves bajo `bookingWizard.licenseVerifier.*` en `client/src/i18n/<lang>.ts` (8 idiomas).
- Nombres propios de las licencias (Permis Côtier, RYA Day Skipper, SBF See…) **no se traducen** — son títulos oficiales en su idioma original.
- Siglas españolas (PNB, PER, Patrón de Yate, Capitán de Yate) **tampoco** — son acrónimos del sistema español.
- Cuando vuelva a estar válida la `ANTHROPIC_API_KEY`, `npm run i18n:translate` puede pulir matices regionales.

## CRM

`InquiriesTab.tsx` muestra:
- Badge bajo el nombre del cliente: verde `valid` / ámbar `probably_valid`/`needs_icc` / rojo `not_recognized`/`insufficient` / muted `unknown`.
- En el modal de detalle: País · Título nativo · Equivalente español · ICC: Sí/No · status badge.
- `licenseType` se guarda en formato `<iso2>:<code>` (ej. `"fr:permis_cotier"`) para que el equipo identifique el título exacto.

## Mobile-first / PWA (TIER 1 + 2 done)

- **Bottom-sheet nativo** (`shadcn Sheet side="bottom"`) en mobile (<768px); inline dropdown en desktop.
- **Lista virtualizada** con `@tanstack/react-virtual` (52px row, overscan 6) — ~14 DOM nodes max.
- **Search input** `text-base` (16px) + `inputMode="search"` + `enterKeyHint="search"` + `autoComplete="off"` — previene zoom de iOS Safari.
- **Search filter** con `useDeferredValue` — no bloquea typing.
- **Sticky Verify CTA** con `pb-safe` (siempre en zona del pulgar).
- **React.lazy + Suspense** — los visitantes "Sin licencia" no descargan el chunk.
- **Skeleton placeholder** (`LicenseVerifierPanelSkeleton.tsx`) con shimmer `motion-safe`.
- **Haptic feedback** `navigator.vibrate(8)` al verificar (no-op donde no se soporta).
- **Bouncy reveal** del summary card con `ease-[cubic-bezier(0.34,1.56,0.64,1)]`.
- **Active scale** `active:scale-[0.98]` en chips/segmented/country rows.
- **Loading state** 250ms en el botón Verificar (sensación de "trabajando para ti").
- **Focus-visible rings** consistentes en todas las superficies interactivas.

## DESIGN.md compliance

- 0 `bg-white`/`bg-black`/`#fff`/`#000` literales.
- 0 nested cards (panel `bg-card/40` sin borde; chips con borde individual).
- 0 shadows decorativos en reposo (solo en hover/active).
- Pill buttons (rounded-full) para CTAs primarios.
- Clash Display reservada para hero — el panel usa Archivo (body font) intencionalmente.

## TIER 3 — estado

1. ✅ **Service worker (Workbox)** — configurado el 2026-05-21 via `vite-plugin-pwa@1.2.0` en `vite.config.ts`.
   - `registerType: "autoUpdate"`, `injectRegister: "auto"` → inyecta `<script src="/registerSW.js">` en `index.html` automáticamente.
   - Precache: `**/*.{js,css,html,woff2}` + `assets/**/*.{avif,webp,svg}` (116 entries, ~5.6 MiB) — incluye el chunk lazy `LicenseVerifierPanel-*.js`, por lo que el panel abre offline después de la primera visita.
   - `navigateFallback: "/index.html"` con denylist explícita para `/api/`, `/admin/`, `/assets/`, sitemaps, feed, robots, well-known y `llms*.txt` — el SPA fallback nunca hijackea endpoints server-side.
   - Runtime caching `CacheFirst` SOLO para `/fonts/*` (1 año, 16 entries) y `/images/*` + `/og-image.webp` (30 días, 80 entries). **Nada de `/api/*`** — decisión deliberada: el modelo de inquiries necesita red garantizada y los GET de precios/disponibilidad no deben servirse stale.
   - `cleanupOutdatedCaches`, `skipWaiting`, `clientsClaim` → updates aplican sin requerir refresh manual.
   - `maximumFileSizeToCacheInBytes: 4 MB` (vendor-charts ≈ 386 kb está por debajo).
   - `manifest: false` + `includeManifestIcons: false` → respetamos nuestro `client/public/manifest.json` manual (no queremos que el plugin sobreescriba).
   - Manifest ampliado: `scope`, `lang`, `dir`, `orientation`, `categories`. Iconos maskable 192/512 quedan pendientes de generación limpia.
   - `devOptions.enabled: false` → el SW no se registra en `npm run dev` para evitar conflictos con HMR.
2. **Standalone PWA detection** — `window.matchMedia('(display-mode: standalone)')` para ajustar UI cuando la app está instalada.
3. ✅ **Offline awareness** — entregado 2026-05-21. Hook `useOnlineStatus` (SSR-safe, listeners online/offline). En el card negativo del summary, encima del CTA WhatsApp, hint `WifiOff` + texto i18n cuando `navigator.onLine === false`. Botón sigue enabled (wa.me deep-linkea a la app nativa que maneja offline). Nueva clave `licenseVerifier.offlineHint` traducida a los 8 idiomas.
4. **Geo-IP defaults** — endpoint `/api/geo` que devuelva el país por IP, sobre-sobreescribe el language default si difiere.
5. **Bandera SVG override en Windows** — emoji flags se ven como acrónimos en Windows. Usar `country-flag-icons` solo en `navigator.userAgent.includes('Windows')`.
6. ✅ **Arrow keys + Escape en country list** — entregado 2026-05-21. Hook local `useListboxKeyboardNav` en `LicenseVerifierPanel.tsx` centraliza ArrowUp/Down/Home/End/Enter/Escape sobre el search input. Funciona en ambos pickers (Sheet mobile + dropdown inline desktop). Auto-scroll del row activo: en virtualizado vía `rowVirtualizer.scrollToIndex({ align: "auto" })`, en inline vía `scrollIntoView({ block: "nearest" })`. Reset de `activeIndex` cuando cambia el filtro. ARIA: `aria-autocomplete="list"`, `aria-activedescendant` apuntando a la fila activa, `role="option"` con `tabIndex={-1}` (focus se queda en el input), `onMouseDown={preventDefault}` para no robar focus al hacer click. Escape llama explícitamente `onOpenChange(false)` aunque Radix ya lo maneja — consistencia entre Sheet e inline.
7. **Iconos PWA 192/512 maskable** — generar desde el logo cuando tengamos el PNG fuente limpio. El manifest los referenciará entonces.

## Commits relevantes

- `567ec77` — wip multi-feature inicial (modal → panel inline).
- `74c2907` — i18n a 7 idiomas + pre-fill país por idioma.
- `f103cc5` — TIER 1+2 mobile-first + PWA (bottom-sheet, virtualizer, lazy, haptic, microinteracciones).

## Capturas de auditoría

`docs/audits/screenshots/2026-05-21-impeccable/`:
- 01-11: estados del panel (320, 390, 768, 1024, 1440 — filling, summary, insufficient, not_recognized).
- 12-15: traducción i18n (en, fr, de) + pre-fill por idioma.
- 16-17: TIER 1+2 (bottom-sheet mobile, inline desktop).
