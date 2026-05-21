/**
 * Apply blog featured-image updates to the production DB.
 *
 * Reads `seo-reports/blog-images-manifest.json`, filters entries with `pilot: true`
 * (or `--all` to apply every entry), and runs `UPDATE blog_posts SET featured_image`
 * for each. Idempotent: rows already at the target value are reported as `skipped`.
 *
 * Usage:
 *   tsx scripts/update-blog-images.ts                # apply pilot entries (default)
 *   tsx scripts/update-blog-images.ts --dry-run      # show what would change, no writes
 *   tsx scripts/update-blog-images.ts --all          # apply every entry, not just pilots
 *   tsx scripts/update-blog-images.ts --all --dry-run
 *   tsx scripts/update-blog-images.ts --rollback     # revert pilot rows to manifest.currentImage
 *   tsx scripts/update-blog-images.ts --rollback --dry-run
 */

import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { blogPosts } from "@shared/schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

interface ManifestEntry {
  slug: string;
  title: string;
  category: string;
  currentImage: string;
  boatId: string;
  rationale: string;
  strategy: "REAL" | "HIGGSFIELD";
  referenceFile: string;
  newPath: string;
  pilot: boolean;
  mode?: string;
  prompt_intent?: string;
}

interface Manifest {
  posts: ManifestEntry[];
}

interface RunResult {
  updated: string[];
  skipped: string[];
  notFound: string[];
  missingAsset: string[];
  errors: { slug: string; message: string }[];
}

function parseFlags() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    all: args.includes("--all"),
    rollback: args.includes("--rollback"),
  };
}

async function main() {
  const { dryRun, all, rollback } = parseFlags();
  const manifestPath = join(repoRoot, "seo-reports", "blog-images-manifest.json");

  if (!existsSync(manifestPath)) {
    console.error(`Manifest not found at ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
  const candidates = all
    ? manifest.posts
    : manifest.posts.filter((p) => p.pilot === true);

  console.log(
    `Manifest: ${manifest.posts.length} total posts, ${candidates.length} ${all ? "applying-all" : "marked pilot"}.`,
  );
  if (rollback) console.log("Mode: ROLLBACK (reverts to manifest.currentImage).");
  if (dryRun) console.log("Mode: DRY-RUN (no writes will be performed).");

  const result: RunResult = {
    updated: [],
    skipped: [],
    notFound: [],
    missingAsset: [],
    errors: [],
  };

  for (const entry of candidates) {
    const targetPath = rollback ? entry.currentImage : entry.newPath;

    // For forward updates, verify the asset file exists on disk before pointing the DB at it.
    // For rollback, skip the disk check — we're pointing back at the original path which may
    // already exist (stock images) or have been removed.
    if (!rollback) {
      const assetPath = join(repoRoot, "client", "public", entry.newPath);
      if (!existsSync(assetPath)) {
        result.missingAsset.push(entry.slug);
        console.warn(`  [missing-asset] ${entry.slug} → ${entry.newPath} not found on disk`);
        continue;
      }
    }

    try {
      const rows = await db
        .select({ id: blogPosts.id, current: blogPosts.featuredImage })
        .from(blogPosts)
        .where(eq(blogPosts.slug, entry.slug));

      if (rows.length === 0) {
        result.notFound.push(entry.slug);
        console.warn(`  [not-found] ${entry.slug}`);
        continue;
      }

      const row = rows[0];
      if (row.current === targetPath) {
        result.skipped.push(entry.slug);
        console.log(`  [skip] ${entry.slug} already at ${targetPath}`);
        continue;
      }

      if (dryRun) {
        result.updated.push(entry.slug);
        console.log(`  [dry] ${entry.slug}: ${row.current} → ${targetPath}`);
        continue;
      }

      await db
        .update(blogPosts)
        .set({ featuredImage: targetPath })
        .where(eq(blogPosts.slug, entry.slug));

      result.updated.push(entry.slug);
      console.log(`  [ok] ${entry.slug}: ${row.current} → ${targetPath}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ slug: entry.slug, message });
      console.error(`  [error] ${entry.slug}: ${message}`);
    }
  }

  console.log("\nSummary:");
  console.log(`  updated:       ${result.updated.length}`);
  console.log(`  skipped:       ${result.skipped.length} (already at target)`);
  console.log(`  not-found:     ${result.notFound.length} (slug missing in DB)`);
  console.log(`  missing-asset: ${result.missingAsset.length} (file not on disk)`);
  console.log(`  errors:        ${result.errors.length}`);

  const exitCode = result.errors.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
