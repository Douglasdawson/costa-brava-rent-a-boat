# SEO Dashboard — Design Document

**Date**: 2026-04-25
**Status**: Approved
**Replaces**: Current SeoTab "Resumen" + "Keywords" + "Competencia" sub-tabs

## Problem

The CRM has 21 SEO tables with daily data (rankings, GSC, GA4, CWV, SERP features, competitors) and 14 MCP tools that query them. However, the current SeoTab displays everything as tables and stat cards — no trend charts, no quick executive summary. The owner needs to know in 10 seconds if SEO is going well or badly.

## Design: Card-Driven Dashboard

Pattern inspired by Plausible/Vercel Analytics. Three metric cards act as both summary indicators AND navigation — clicking a card switches the chart and table below it.

### Sub-tab restructure

```
Before: [Resumen] [Keywords] [Campanas] [Competencia] [Experimentos] [Informes] [Salud]
After:  [Dashboard] [Campanas] [Experimentos] [Informes] [Salud]
         ^^^^^^^^^
         NEW (replaces Resumen + Keywords + Competencia)
```

Campanas, Experimentos, Informes, and Salud remain unchanged.

### Layout

```
+--------------------------------------------------------------+
|  [7d] [30d] [90d] [Custom]                    [bell] alerts  |
+------------------+------------------+------------------------+
|  * POSICIONES    |   TRAFICO        |    COMPETIDORES        |
|    2.8 avg       |   1,240 clicks   |    Ganando 12/18 kw    |
|    ^ +0.4        |   ^ +8%          |    v perdiendo 3       |
|   [sparkline]    |   [sparkline]    |    [sparkline]         |
|   (selected)     |                  |                        |
+------------------+------------------+------------------------+
|                                                              |
|   CHART AREA - changes based on active card:                 |
|                                                              |
|   - Posiciones: line chart, Y = position (inverted), X=time |
|     Multiple lines for top keywords                          |
|   - Trafico: area chart (clicks + impressions stacked)       |
|   - Competidores: line chart, my position vs theirs          |
|     For the keyword selected in table below                  |
|                                                              |
+--------------------------------------------------------------+
|                                                              |
|   TABLE AREA - changes based on active card:                 |
|                                                              |
|   - Posiciones: keyword | pos | delta | clicks | impr | CTR |
|     Filters: cluster, language                               |
|   - Trafico: page | clicks | impr | CTR | avg position      |
|     Filters: device, country                                 |
|   - Competidores: scoreboard keyword x competitor            |
|     Click keyword -> chart above filters to that keyword     |
|                                                              |
+--------------------------------------------------------------+
```

### Semaphore logic (card border/indicator color)

| Card | Green | Yellow | Red |
|------|-------|--------|-----|
| Posiciones | avg < 5 | 5-10 | > 10 |
| Trafico | clicks up vs prev period | stable (< 5% change) | clicks down |
| Competidores | winning majority of keywords | tied | losing majority |

### Alert badge

Top-right bell icon shows count of unresolved alerts from `seoAlerts` table. Clicking opens a small popover with alert titles and severity. Links to Salud sub-tab for details.

## Data sources

All data already exists in the database. No new API endpoints needed — the existing `/api/admin/seo/dashboard`, `/api/admin/seo/keywords`, and `/api/admin/seo/competitors` endpoints provide the raw data. We may need to extend them with date-range parameters.

| Card | DB tables | Existing endpoint |
|------|-----------|-------------------|
| Posiciones | seoKeywords + seoRankings | /api/admin/seo/keywords (extend with date range) |
| Trafico | seoRankings (aggregated clicks/impressions) | /api/admin/seo/dashboard (extend) |
| Competidores | seoCompetitors + seoCompetitorRankings | /api/admin/seo/competitors (extend) |
| Alerts badge | seoAlerts | /api/admin/seo/alerts (already exists) |
| Sparklines | seoRankings (daily aggregates) | New: /api/admin/seo/trends?metric=X&days=N |

## Tech stack

- **Charts**: Recharts (already installed, used in DashboardTab)
- **UI components**: shadcn/ui Card, Tabs, Table, Badge, Popover (already in project)
- **State**: React useState for active card, date range; useQuery for data fetching
- **Responsiveness**: Mobile-first; cards stack vertically on small screens, chart area full-width

## Component architecture

```
SeoTab.tsx (existing, modified)
  |-- sub-tab: "dashboard" (NEW)
  |     |-- SeoDashboard.tsx (new orchestrator)
  |           |-- SeoDateRangeSelector.tsx
  |           |-- SeoAlertBadge.tsx
  |           |-- SeoMetricCard.tsx (x3: positions, traffic, competitors)
  |           |-- SeoTrendChart.tsx (switches chart type based on active card)
  |           |-- SeoDataTable.tsx (switches columns/data based on active card)
  |-- sub-tab: "campaigns" (unchanged)
  |-- sub-tab: "experiments" (unchanged)
  |-- sub-tab: "reports" (unchanged)
  |-- sub-tab: "health" (unchanged)
```

## What we are NOT building

- No CWV visualization (not in user priorities; stays in Salud tab)
- No SERP features visualization (stays in existing data)
- No new database tables
- No changes to data collection jobs
- No changes to Campanas/Experimentos/Informes/Salud sub-tabs

## Risks

- **Sparse data**: If rank tracking just started, charts may look empty. Mitigation: show "Datos insuficientes" message when < 7 data points.
- **Performance**: Large date ranges with many keywords could be slow. Mitigation: limit to top 20 keywords in chart, paginate table.
