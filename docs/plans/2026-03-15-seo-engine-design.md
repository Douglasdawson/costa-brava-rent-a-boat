# SEO Engine: Agent-Driven Autonomous SEO System

## Date: 2026-03-15
## Status: APPROVED

---

## 1. Vision

Build an autonomous SEO engine that monitors, analyzes, and optimizes the site's search positioning 24/7. The system thinks like a senior SEO strategist: builds a model of the landscape, identifies the highest-impact opportunities, executes coordinated campaigns, measures results, and learns.

**Goal**: Be the #1 reference for boat rentals in Costa Brava — not just rank first, but dominate every SERP feature, be cited by AI engines, and convert organic traffic into bookings.

**North star metric**: Revenue attributed to organic search, not just rankings.

---

## 2. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Agent-driven (Claude API as brain) | Adapts without code changes, explains decisions, improves with model upgrades |
| Process | Separate worker (`server/seo/worker.ts`) | Doesn't affect web performance; if worker crashes, site stays up |
| Intelligence | Claude Sonnet for daily analysis, Opus for weekly strategy | Cost-effective: Sonnet handles routine, Opus handles complex decisions |
| Granularity | Campaigns (multi-week coordinated strategies) | Individual actions don't move the needle; campaigns compound |
| Content edits | Content-as-data (DB tables, not hardcoded files) | System can modify meta tags, FAQs, links without git commits |
| SERP data | ValueSERP API (~$50/mo, 5000 searches) | Best price/quality for the volume needed |
| Frequency | Adaptive by season | Pre-season aggressive, peak protective, off-season building |
| Budget | ~$80/month (Claude API + ValueSERP) | Moderate tier per user preference |
| Autonomy | Fully autonomous with WhatsApp alerts + CRM dashboard | User chose full autonomy; reviews via weekly digest |
| Alerts | WhatsApp (urgent) + CRM dashboard (detailed) | Per user preference |

---

## 3. Competitors to Track

| Competitor | Type | URL |
|------------|------|-----|
| Click&Boat | Platform (global) | https://www.clickandboat.com |
| SamBoat | Platform (global) | https://www.samboat.es |
| Blanes Boats | Local competitor | https://www.blanesboats.com |
| Eric Boats Blanes | Local competitor | https://ericboatsblanes.com |
| Rent a Boat Blanes | Local competitor | https://www.rentaboatblanes.com |

**Strategy against platforms**: Win through LOCAL relevance, specificity, rich local content (they can't write 1200 words about Blanes harbor specifically).
**Strategy against locals**: Win through technical excellence, content volume, and systematic optimization (they don't have automation).

---

## 4. Architecture

### 4.1 System Layers

```
                        +----------------------------------+
                        |        SEO STRATEGIST            |
                        |        (Claude API)              |
                        |                                  |
                        |  Input:  full landscape snapshot |
                        |  Output: prioritized decisions   |
                        +---------------+------------------+
                                        |
              +-------------------------+-------------------------+
              v                         v                         v
     +----------------+      +------------------+      +-----------------+
     |  DATA LAYER    |      | EXECUTION LAYER  |      | FEEDBACK LAYER  |
     |  (mechanical)  |      |  (mechanical)    |      |  (mechanical)   |
     |                |      |                  |      |                 |
     | - GSC sync     |      | - Meta editor    |      | - Experiment    |
     | - SERP tracker |      | - Content writer |      |   tracker       |
     | - Competitor   |      | - Schema updater |      | - Revenue       |
     |   crawler      |      | - Link injector  |      |   correlator    |
     | - Site health  |      | - Page creator   |      | - Alert engine  |
     | - GEO monitor  |      |                  |      |                 |
     +-------+--------+      +--------+---------+      +--------+--------+
             |                         |                         |
             +-------------------------+-------------------------+
                                       v
                     +---------------------------------+
                     |    SEO KNOWLEDGE BASE (Neon)    |
                     |                                 |
                     |  Keywords <-> Pages             |
                     |  Competitors <-> Rankings        |
                     |  Experiments <-> Results         |
                     |  Campaigns <-> Actions           |
                     |  Bookings <-> Keywords           |
                     |  GEO citations                   |
                     |  Seasonal patterns               |
                     +---------------------------------+

              +----------------------------------------+
              |            OUTPUT LAYER                 |
              |                                        |
              |  WhatsApp: urgent alerts               |
              |  CRM Dashboard: metrics + campaigns    |
              |  Weekly Digest: executive summary       |
              |  MCP Server: queries from Claude Code  |
              +----------------------------------------+
```

### 4.2 SEO Strategist Agent (The Brain)

The core intelligence is a Claude API call that receives a complete briefing and returns structured decisions. No hardcoded scoring algorithms, no rule engines.

**Briefing (input)**:
- Keyword snapshot: positions, CTR, impressions, 30-day trends
- Competitor map: who's rising, who's falling, what they changed
- SERP features by keyword: FAQ, local pack, AI overview, images
- Active experiments and their partial results
- Historical learnings: "titles with price improve CTR +15%"
- Business data: which keywords generate actual bookings
- Seasonality: where we are in the annual cycle
- Active campaign progress
- Current page content for optimization candidates

**Decisions (output)**:
- New campaigns to launch (with justification)
- Prioritized concrete actions (max 2-3 this week, adaptive by season)
- Hypothesis per action (what it expects to happen)
- Actions to pause or cancel
- Alerts requiring human attention
- Full reasoning (saved for audit trail)

**Model selection**:
- Daily analysis (keyword classification, opportunity detection): Claude Sonnet
- Weekly strategy (campaign planning, cross-campaign prioritization): Claude Opus

### 4.3 Campaigns, Not Individual Actions

Each optimization initiative is a multi-week campaign:

```
Campaign: "Dominate 'sin licencia' cluster"
- Objective: Top 3 for all 'alquiler barco sin licencia' + location variants
- Duration: 6 weeks
- Actions: coordinated title optimization, content expansion, FAQ creation,
  landing page, internal linking, SERP feature targeting
- Measurement: cumulative clicks, revenue attributed, positions gained
```

The agent manages multiple concurrent campaigns, prioritizing actions from each.

### 4.4 Revenue Attribution

Connect SEO data with booking data:

```
Keyword -> Page visit (via GSC/referrer) -> Session -> Booking -> Revenue

Table: seoConversions
- keyword, page, sessionId, bookingId, revenue, date
```

This allows the agent to prioritize keywords that generate money, not just traffic.

### 4.5 GEO Monitor

Track citations in AI-generated answers:

- Query Perplexity API for main keywords periodically
- Scrape Google AI Overviews when available
- Detect whether the site is cited, mentioned, or absent
- Analyze what cited sources do differently
- Feed into strategist agent for optimization decisions

### 4.6 Content-as-Data

Move editable SEO content from hardcoded files to DB:

| Currently hardcoded | Migrate to DB table |
|---------------------|---------------------|
| Meta titles/descriptions in seoInjector.ts | `seoMeta` (page, lang, title, description) |
| FAQs in location pages | `seoFaqs` (page, question, answer, lang) |
| Manual internal links | `seoLinks` (fromPage, toPage, anchor, autoGenerated) |

Server reads from DB at runtime. Execution layer writes to DB. No git commits needed for content optimizations.

### 4.7 Adaptive Frequency

| Season | Period | Actions/week | Focus |
|--------|--------|-------------|-------|
| Pre-season | Mar-May | 4-5 | Create seasonal content, launch campaigns, aggressive optimization |
| Peak | Jun-Sep | 1-2 | Protect rankings, fix technical issues only, intense monitoring |
| Post-season | Oct-Feb | 3-4 | Content building for next year, deep analysis, experimentation |

---

## 5. Database Schema (New Tables)

### Core tracking
- `seoKeywords` — tracked keywords + daily rankings + volume + intent classification
- `seoPages` — site pages + current metrics + optimizable content
- `seoCompetitors` — competitor rankings + detected content changes
- `seoSerpFeatures` — SERP features present per keyword (FAQ, local, images, AI overview)

### Intelligence
- `seoCampaigns` — active campaigns with objective, progress, timeline, status
- `seoExperiments` — executed actions with hypothesis, expected result, actual result, learning
- `seoConversions` — keyword -> booking revenue attribution
- `seoLearnings` — accumulated learnings from experiments (fed to strategist agent)

### Content-as-data
- `seoMeta` — editable meta tags per page/language
- `seoFaqs` — dynamic FAQs per page (managed by system)
- `seoLinks` — internal links managed by the system

### Monitoring
- `seoGeo` — AI citations tracking (Perplexity, Google AI, ChatGPT)
- `seoAlerts` — generated alerts + status (sent/acknowledged/resolved)
- `seoReports` — weekly generated reports (stored as JSONB)
- `seoHealthChecks` — technical health crawl results

---

## 6. Worker Process

```
server/seo/
  worker.ts          -- Entry point, cron orchestrator
  collectors/
    gsc.ts           -- Google Search Console data sync
    serp.ts          -- ValueSERP keyword tracking
    competitors.ts   -- Competitor ranking + content monitoring
    health.ts        -- Site technical health crawl
    geo.ts           -- AI citation monitoring
  strategist/
    agent.ts         -- Claude API strategist calls
    briefing.ts      -- Builds context for the agent
    parser.ts        -- Parses agent decisions into executable actions
  executors/
    meta.ts          -- Updates seoMeta table
    content.ts       -- Generates/modifies page content
    schema.ts        -- Updates JSON-LD structured data
    links.ts         -- Manages internal links
    pages.ts         -- Creates new landing pages
  feedback/
    experiments.ts   -- Tracks experiment outcomes
    revenue.ts       -- Correlates keywords with bookings
    learnings.ts     -- Extracts and stores learnings
  alerts/
    engine.ts        -- Generates alerts from anomalies
    whatsapp.ts      -- Sends via Twilio
  reports/
    weekly.ts        -- Generates weekly digest
    dashboard.ts     -- Feeds CRM dashboard data
```

**Cron schedule**:

| Job | Frequency | Description |
|-----|-----------|-------------|
| GSC sync | Every 6h | Pull latest keyword/page data |
| SERP tracking | Daily 6am | Track rankings for priority keywords |
| Competitor check | Daily 7am | Check competitor rankings + changes |
| Site health | Every 6h | Crawl sitemap, verify status/speed/meta |
| GEO monitor | Weekly Mon 8am | Query AI engines for main keywords |
| Strategist (daily) | Daily 9am | Sonnet: analyze data, detect opportunities |
| Strategist (weekly) | Weekly Mon 10am | Opus: plan campaigns, review experiments |
| Execute actions | Tue/Thu 10am | Apply the strategist's top decisions |
| Experiment review | Daily 11am | Check results of running experiments |
| Revenue correlation | Daily midnight | Match bookings with keywords |
| Weekly report | Sunday 8pm | Generate and send weekly digest |
| Alert check | Every 6h | Check for anomalies, send if needed |

---

## 7. MCP Server

New `server/mcp/seo-engine-server.ts`:

| Tool | Description |
|------|-------------|
| `seo_dashboard` | Current metrics overview |
| `seo_keywords` | Keyword rankings with filters |
| `seo_opportunities` | Detected opportunities sorted by impact |
| `seo_campaigns` | Active campaigns with progress |
| `seo_experiments` | Experiment history with results |
| `seo_competitors` | Competitor comparison report |
| `seo_geo_status` | AI citation status |
| `seo_force_analysis` | Trigger immediate strategist analysis |
| `seo_revenue` | Revenue attribution by keyword |
| `seo_alerts` | Active alerts |

---

## 8. CRM Dashboard

New admin section `/admin/seo`:

- **Overview**: top keywords, positions, CTR, revenue attributed
- **Campaigns**: active campaigns with timeline and progress
- **Experiments**: history with hypothesis, result, learning
- **Competitors**: side-by-side comparison
- **Alerts**: active alerts with context
- **Reports**: weekly digests archive
- **GEO**: AI citation status
- **Settings**: toggle autonomy, adjust frequency, manage tracked keywords

---

## 9. Tech Stack

| Component | Technology | Cost |
|-----------|-----------|------|
| Worker process | Node.js + tsx | Free (same hosting) |
| Scheduling | node-cron (existing) | Free |
| Database | Neon PostgreSQL (existing) | Free tier |
| AI (daily) | Claude Sonnet API | ~$15-25/mo |
| AI (weekly + content) | Claude Opus API | ~$15-25/mo |
| SERP tracking | ValueSERP API | ~$50/mo |
| GEO monitoring | Perplexity API | ~$5/mo |
| Alerts | Twilio WhatsApp (existing) | Existing cost |
| Dashboard | React + shadcn/ui (existing stack) | Free |
| **Total** | | **~$85/mo** |

---

## 10. Implementation Phases

### Phase 1: Foundation (Data Layer + Schema)
- Create all DB tables
- Build worker process skeleton with cron orchestrator
- Implement GSC collector (enhance existing)
- Implement site health crawler
- Implement basic CRM dashboard

### Phase 2: Intelligence (SERP + Competitors)
- Integrate ValueSERP API
- Build SERP tracker (daily keyword monitoring)
- Build competitor crawler
- Implement SERP feature detection
- Keyword auto-discovery from GSC data

### Phase 3: The Brain (Strategist Agent)
- Build briefing assembler
- Implement Claude API strategist calls (Sonnet daily, Opus weekly)
- Build decision parser
- Implement campaign management
- Implement experiment tracking framework

### Phase 4: Execution Layer
- Content-as-data migration (meta tags, FAQs, links from code to DB)
- Build meta editor executor
- Build content writer executor
- Build internal link injector
- Build schema updater

### Phase 5: Feedback & Learning
- Revenue attribution (keyword -> booking correlation)
- Experiment outcome measurement
- Learning extraction and storage
- Adaptive frequency based on season

### Phase 6: GEO + Advanced
- Perplexity API integration
- Google AI Overview monitoring
- GEO optimization recommendations
- MCP server with all tools

### Phase 7: Dashboard & Reporting
- Full CRM dashboard with all sections
- Weekly digest generation
- WhatsApp alert system
- Historical reporting and trends

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| System makes a change that tanks rankings | Experiment framework: small changes, measure before expanding. Rollback capability in seoExperiments. Peak season: protective mode (1-2 actions only) |
| Claude API costs spike | Token budgets per job. Sonnet for routine, Opus only for weekly strategy. Cache repeated analyses |
| ValueSERP API limits hit | Priority queue: track only high-value keywords daily, rest weekly |
| Competitor blocks scraping | ValueSERP handles this (they use proxies). For direct competitor content analysis, cache aggressively |
| Content-as-data breaks SEO injection | Fallback: if DB read fails, use hardcoded defaults. Gradual migration with A/B validation |
| Worker process crashes | Health check endpoint. Auto-restart via process manager. Alert on crash |
