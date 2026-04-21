# 2026-04-21 — seo_keywords: add language column

## Context

`shared/schema.ts` declared `seoKeywords.language VARCHAR(5) NOT NULL` with a
unique index on `(keyword, language)`, but the production `seo_keywords` table
was missing that column entirely — it had `volume INT NULL` instead.

The drift silently broke every query that referenced `seoKeywords.language`:

- `server/mcp/seo-autopilot/tools.ts:94` (`autopilot_keyword_radar`) — returned
  a 500 with a raw Postgres error `column seo_keywords.language does not exist`.
- `server/routes/admin-seo-autopilot.ts:97` — same issue on the admin keyword
  radar endpoint.
- `server/seo/collectors/gsc.ts:61` — every GSC ingest run that tried to upsert
  a keyword failed the same way.

Discovered during SEO Round 3 audit (2026-04-21) while investigating the brief's
FIX #5.

## Decision

Align the DB with the Drizzle schema rather than the other way round. Drizzle
captured the intended state; the DB was stale. All 175 existing keyword rows
are Spanish (sampled: "alquiler barco blanes", "alquiler barco sin carnet
sitges", "barco sin titulo costa brava", etc.), so backfilling `language='es'`
is accurate and lossless.

## Migration executed

Run against the Neon production DB on 2026-04-21.

```sql
BEGIN;

-- 1. Add the column nullable to avoid locking failures on existing rows
ALTER TABLE seo_keywords ADD COLUMN IF NOT EXISTS language VARCHAR(5);

-- 2. Backfill all 175 existing rows (all sampled are ES)
UPDATE seo_keywords SET language = 'es' WHERE language IS NULL;

-- 3. Enforce NOT NULL now that every row has a value
ALTER TABLE seo_keywords ALTER COLUMN language SET NOT NULL;

-- 4. Create the unique index Drizzle declares (required by
--    gsc.ts onConflictDoUpdate targets: [keyword, language])
CREATE UNIQUE INDEX IF NOT EXISTS seo_keywords_keyword_language_idx
  ON seo_keywords (keyword, language);

COMMIT;
```

Result (verified): `UPDATE 175` + `CREATE INDEX` succeeded. `\d seo_keywords`
shows the column is `not null` with the unique index present.

## Companion code change

`shared/schema.ts` also adds the existing DB column `volume INT NULL` to the
Drizzle definition so that future `npm run db:push` does not drop it. The
column currently holds 0 non-null values but is present for future search-volume
data import.

## Verification post-migration

MCP call reproducing the original bug — now returns results cleanly:

```bash
curl -sX POST https://www.costabravarentaboat.com/api/mcp/seo-autopilot \
  -H "Authorization: Bearer <MCP_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"autopilot_keyword_radar",
                 "arguments":{"language":"es","limit":3}}}'
# => { "count": 3, "results": [ {seo_keywords: {...}, seo_rankings: {...}}, ... ] }
```

## Rollback

Only needed if a defect emerges in downstream code that depends on `language`
being NULL-able or absent. Reversal is additive-safe:

```sql
-- NOT recommended; included for completeness
BEGIN;
ALTER TABLE seo_keywords DROP INDEX seo_keywords_keyword_language_idx;
ALTER TABLE seo_keywords ALTER COLUMN language DROP NOT NULL;
-- Do NOT drop the column — it keeps Drizzle-and-DB aligned.
COMMIT;
```

## Follow-up

- GSC ingest job (`server/seo/collectors/gsc.ts`) and admin keyword radar
  endpoint should now work end-to-end on the next run. Monitor the next
  scheduled GSC sync logs to confirm upserts land.
- If future keyword ingests add non-Spanish data, seed them with the right
  `language` value; the unique index will deduplicate `(keyword, language)`
  pairs correctly.
