# Google Places API (New) — Setup & Operations

Fuente única de verdad para el rating / reviews del Google Business Profile de Costa Brava Rent a Boat, servida a frontend + schemas SSR + llms.txt + MCP dev tools.

## Credenciales

| Campo | Valor |
|-------|-------|
| GCP Project ID | `costa-brava-rent-a-boat` |
| Project Number | `461423895865` |
| Billing Account | `011C26-FEF3A7-364D15` |
| API habilitada | `places.googleapis.com` (Places API New) |
| API Key display name | `CBRB Places API — Server (weekly sync)` |
| API Key name | `projects/461423895865/locations/global/keys/6e4b96a3-1c79-4837-8b84-83a4a43e50bd` |
| Place ID (canonical) | `ChIJb4WolCwXuxIRp-DybpP6LZo` |
| Place ID (legacy CID) | `0x12bb172c94a8856f:0x9a2dfa936ef2e0a7` |
| Short GMB URL | https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5 |
| Cuenta Google owner | ivanramirezdawson@gmail.com |

**Consola:** https://console.cloud.google.com/apis/credentials?project=costa-brava-rent-a-boat

## Datos verificados en primera llamada (2026-04-22)

| Campo | Valor API | Notas |
|-------|-----------|-------|
| `displayName` | Costa Brava Rent a Boat - Blanes | ✓ match NAP |
| `rating` | 4.8 | Canonical para schemas / copy |
| `userRatingCount` | 310 | ⚠ reemplazar hardcodes 300/307/300+/200+ |
| `internationalPhoneNumber` | +34 611 50 03 72 | Formato oficial (con espacios cada 3) |
| `websiteUri` | `https://costabravarentaboat.app/` | ⚠ el GBP apunta a `.app` en vez de `.com` — revisar desde Business Profile si es typo |
| `regularOpeningHours` | Mo-Su 9:00 AM – 8:00 PM | Coincide con schemas |
| Coordenadas | 41.6722504, 2.7978625 | Coincide con `seo-config.ts` tras fix del commit `1a02a63` |

## Runtime (pendiente de implementar)

```
┌─────────────────┐       ┌────────────────────┐
│ cron (weekly    │──┐    │ MCP gbp-server     │
│ Sunday 3am UTC) │  │    │ (dev tools)        │
└─────────────────┘  │    └────────────────────┘
                     │                ▲
                     ▼                │
         ┌──────────────────────────────┐
         │ server/services/gbpSync.ts   │
         │  - fetch Places API          │
         │  - parse + validate          │
         │  - save to DB                │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │ DB: business_stats           │
         │  rating, userRatingCount,    │
         │  lastSyncedAt, rawPayload    │
         └──────────────┬───────────────┘
                        │
          ┌─────────────┴──────────────┐
          ▼                            ▼
   GET /api/business-stats     SSR schemas (HomePageSEO,
   (cache 1h memoria)           BoatDetailPage, seoInjector)
          │
          ▼
   Frontend React Query
   (Hero trust bar, etc.)
```

## Campos consumidos (field mask canonical — SKU Basic)

```
id,displayName,rating,userRatingCount,regularOpeningHours.weekdayDescriptions,internationalPhoneNumber,websiteUri,reviews.rating,reviews.text,reviews.authorAttribution.displayName,reviews.publishTime
```

**Importante:** no pedir `photos`, `priceLevel`, ni fields Enterprise — eso mueve a SKU Pro ($17/1k) o Enterprise (más). Con este mask el SKU es **Place Details Basic (~$5/1000 req)**.

## Coste estimado

- Cron semanal: 52 req/año
- 1 req = ~$0.005
- **Total: $0.26/año**

Budget alert configurado a $10/mes (50/90/100%) como safety net contra bug en el cron.

## Rotación de API key

1. Crear nueva key: `gcloud services api-keys create --display-name="CBRB Places API (v2)" --api-target=service=places.googleapis.com`
2. Obtener keyString: output directo o `gcloud services api-keys get-key-string <NAME>`
3. Actualizar `.env` local + Replit Secrets
4. Deploy + verificar `/api/business-stats` responde con `lastSyncedAt` actualizado
5. Disable key v1 (observar 30 días, luego delete)

## Monitoring

- **Quotas:** https://console.cloud.google.com/apis/api/places.googleapis.com/quotas?project=costa-brava-rent-a-boat
- **Budgets:** https://console.cloud.google.com/billing/011C26-FEF3A7-364D15/budgets
- **Logs de uso:** Cloud Logging — filter `resource.type="consumed_api"`

## Replit Secrets (PRODUCCIÓN — PENDIENTE)

Las mismas 3 vars del `.env` local deben estar en Replit Secrets:
- `GOOGLE_PLACES_API_KEY`
- `GOOGLE_PLACES_PLACE_ID`
- `GOOGLE_PLACES_PROJECT_ID`

Sin esto, el deploy en Replit no podrá sincronizar.

## Troubleshooting

| Error | Diagnóstico | Fix |
|-------|-------------|-----|
| `403 PERMISSION_DENIED` | Key restringida a dominio/IP que no matchea | Quitar restricción temporalmente, o ajustar IP del server de producción |
| `SERVICE_DISABLED` | API no habilitada en proyecto | `gcloud services enable places.googleapis.com` |
| `400 INVALID_FIELD_MASK` | Campos no disponibles en el SKU pagado | Revisar field mask vs https://developers.google.com/maps/documentation/places/web-service/place-details |
| `NOT_FOUND` en Place ID | Place ID obsoleto (movieron el negocio?) | Re-resolver con Text Search como en setup inicial |
| Rating no cambia en 3 meses | Normal para negocio con 300+ reviews | No es bug. Opcionalmente bajar frecuencia cron a mensual |

## Historial

- **2026-04-22**: Setup inicial. Project + API + key creados. Rating verificado: 4.8 / 310 reviews.
