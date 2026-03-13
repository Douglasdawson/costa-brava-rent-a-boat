# Google Analytics & Search Console Integration — Design

**Date:** 2026-03-13
**Status:** Approved

## Goal

Integrate Google Search Console and GA4 data into the CRM admin panel, giving the business owner visibility into organic search performance, traffic, audience, and conversions without leaving the app.

## Architecture

```
Google APIs (GSC + GA4)
        ↓ (daily cron at 6:00 AM)
googleAnalyticsService.ts
        ↓
analytics_snapshots (PostgreSQL, JSONB)
        ↓
admin-analytics.ts (Express endpoints)
        ↓
CRM Frontend (Reportes + SEO & Analytics tab)
```

## Configuration

### Google Cloud Service Account

- Scopes: `webmasters.readonly`, `analytics.readonly`
- Must be added as user in GSC property and GA4 property

### Environment Variables

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_ANALYTICS_PROPERTY_ID=384574154
GSC_SITE_URL=sc-domain:costabravarentaboat.com
```

### NPM Package

- `googleapis` (official Google API client)

## Data Model

```sql
CREATE TABLE analytics_snapshots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  source TEXT NOT NULL,          -- 'gsc' | 'ga4'
  metric_type TEXT NOT NULL,     -- 'overview' | 'keywords' | 'pages' | 'traffic' | 'devices' | 'countries' | 'conversions'
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, source, metric_type)
);
```

JSONB allows flexible schema — no migrations needed when adding new metrics.

## Backend

### Service: `server/services/googleAnalyticsService.ts`

Core functions:

| Function | Source | Returns |
|----------|--------|---------|
| `fetchGSCOverview(start, end)` | GSC | clicks, impressions, ctr, position |
| `fetchGSCKeywords(start, end, limit)` | GSC | top keywords with metrics |
| `fetchGSCPages(start, end, limit)` | GSC | top pages from search |
| `fetchGA4Overview(start, end)` | GA4 | users, sessions, newUsers, bounceRate |
| `fetchGA4TrafficSources(start, end)` | GA4 | organic, direct, social, referral breakdown |
| `fetchGA4Devices(start, end)` | GA4 | mobile, desktop, tablet split |
| `fetchGA4Countries(start, end)` | GA4 | top countries |
| `fetchGA4Conversions(start, end)` | GA4 | booking_started, whatsapp_click, phone_click events |

### Endpoints: `server/routes/admin-analytics.ts`

All protected with `requireAdminSession`.

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/analytics/overview` | Combined GSC + GA4 KPIs |
| `GET /api/admin/analytics/keywords?days=28` | Top keywords |
| `GET /api/admin/analytics/pages?days=28` | Top pages |
| `GET /api/admin/analytics/traffic?days=28` | Traffic sources |
| `GET /api/admin/analytics/devices?days=28` | Device breakdown |
| `GET /api/admin/analytics/countries?days=28` | Top countries |
| `GET /api/admin/analytics/trends?days=90` | Time series for charts |
| `GET /api/admin/analytics/conversions?days=28` | Conversion events |

All endpoints read from `analytics_snapshots` cache. If no cached data exists, they fall back to live API calls.

### Cron Job

- Runs daily at 6:00 AM
- Updates last 7 days of data (covers GSC's 2-3 day reporting delay)
- Uses existing cron infrastructure or `node-cron`

## Frontend

### Tab "Reportes" — New "Google" Section

- 4 KPI cards: Organic Clicks, Impressions, Avg CTR, Avg Position
- Mini sparkline chart (7 days)
- Link to "Ver más en SEO & Analytics"

### New Tab "SEO & Analytics"

Sub-sections with internal tabs:

**Overview:**
- KPI cards: clicks, impressions, CTR, position, users, sessions
- Trend chart 30/90 days (dual line: clicks + users)
- Period-over-period comparison (% change)

**Keywords:**
- Sortable table: keyword, clicks, impressions, CTR, position
- Filter by position range (top 3, top 10, top 20, >20)

**Pages:**
- Table: URL, clicks, impressions, CTR, position
- Groupable by type (home, boats, blog, destinations, locations)

**Traffic:**
- Donut chart: organic vs direct vs social vs referral
- Detail table by source

**Audience:**
- Donut: devices (mobile/desktop/tablet)
- Top 10 countries with flags
- New vs returning users

**Conversions:**
- Tracked events: booking_started, whatsapp_click, phone_click
- Funnel: visits → booking started → booking completed
- Conversion rate

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `server/services/googleAnalyticsService.ts` |
| Create | `server/routes/admin-analytics.ts` |
| Create | `client/src/components/crm/AnalyticsTab.tsx` |
| Create | `client/src/components/crm/ReportesGoogleSection.tsx` |
| Modify | `shared/schema.ts` — add `analyticsSnapshots` table |
| Modify | `server/routes.ts` — register analytics routes |
| Modify | `client/src/components/crm/AdminLayout.tsx` — add tab |
| Modify | `client/src/components/crm/ReportsDashboard.tsx` — add Google section |

## Manual Setup Required (User)

1. Create Google Cloud project (or use existing)
2. Enable Search Console API + Analytics Data API
3. Create Service Account + download key
4. Add Service Account email as user in GSC property
5. Add Service Account as Viewer in GA4 property
6. Set environment variables in Replit
