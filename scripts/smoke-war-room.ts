// scripts/smoke-war-room.ts
// Smoke test — runs each War Room Fase 2 collector once with minimal scope
// to verify env vars, API connectivity, and DB writes are working.
//
// Run: npx tsx scripts/smoke-war-room.ts

import "dotenv/config";
import { collectGscQueries } from "../server/seo/collectors/gscQueries";
import { collectGa4Daily } from "../server/seo/collectors/ga4Daily";
import { collectPsi } from "../server/seo/collectors/psi";
import { collectSerpSnapshots } from "../server/seo/collectors/serpSnapshots";

type Step = { name: string; run: () => Promise<unknown> };

const steps: Step[] = [
  { name: "gsc_queries (1 day)", run: () => collectGscQueries({ daysBack: 1 }) },
  { name: "ga4_daily (1 day)", run: () => collectGa4Daily({ daysBack: 1 }) },
  {
    name: "psi (homepage mobile only)",
    run: () =>
      collectPsi({
        targets: [{ url: "https://www.costabravarentaboat.com/", strategies: ["mobile"] }],
        delayMs: 0,
      }),
  },
  { name: "serp_snapshots (2 keywords)", run: () => collectSerpSnapshots({ maxKeywords: 2, delayMs: 500 }) },
];

async function main() {
  console.log(`=== War Room Fase 2 smoke test ===`);
  const results: Array<{ step: string; ok: boolean; ms: number; data?: unknown; error?: string }> = [];

  for (const step of steps) {
    const t0 = Date.now();
    process.stdout.write(`- ${step.name} … `);
    try {
      const data = await step.run();
      const ms = Date.now() - t0;
      console.log(`OK (${ms}ms)`);
      results.push({ step: step.name, ok: true, ms, data });
    } catch (error) {
      const ms = Date.now() - t0;
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`FAIL (${ms}ms): ${msg}`);
      results.push({ step: step.name, ok: false, ms, error: msg });
    }
  }

  console.log(`\n=== Results ===`);
  console.log(JSON.stringify(results, null, 2));
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} steps passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
