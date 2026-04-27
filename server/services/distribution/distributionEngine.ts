/**
 * Distribution Engine — orchestrates platform adapters reading the
 * `distribution_tray` table and routes each pending item to its adapter.
 *
 * Public API:
 *   publishOne(itemId)     — publish a single item by id (idempotent)
 *   publishPending(opts?)  — iterate all pending items and publish them
 *
 * Behaviour:
 *   - Idempotent: re-publishing an already-published item returns {alreadyPublished:true}
 *   - On adapter success: marks status=published, fills publishedUrl + publishedAt
 *   - On adapter failure: marks status=failed, fills failureReason. No automatic retry.
 *   - Always logs a structured audit entry via seoAutopilotRepo.recordAudit
 */

import type { DistributionPlatform, DistributionTrayItem } from "@shared/schema";
import { logger } from "../../lib/logger";
import { storage, seoAutopilotRepo } from "../../storage";
import type { PlatformAdapter, AdapterResult } from "./adapters/types";
import { facebookAdapter } from "./adapters/facebookAdapter";
import { linkedinAdapter } from "./adapters/linkedinAdapter";
import { mediumAdapter } from "./adapters/mediumAdapter";
import { gbpAdapter } from "./adapters/gbpAdapter";

// Platforms we can auto-publish in Phase 1.
// Items targeting other platforms are skipped (left as pending) until a
// future phase adds an adapter for them.
const SUPPORTED_PLATFORMS: Record<string, PlatformAdapter> = {
  facebook: facebookAdapter,
  linkedin: linkedinAdapter,
  medium: mediumAdapter,
  google_business: gbpAdapter,
};

export interface PublishOneResult {
  ok: boolean;
  itemId: number;
  alreadyPublished?: boolean;
  unsupported?: boolean;
  publishedUrl?: string;
  error?: string;
  statusCode?: number;
}

export interface PublishPendingResult {
  attempted: number;
  ok: number;
  failed: number;
  skipped: number;
  results: PublishOneResult[];
}

function pickAdapter(platform: string): PlatformAdapter | null {
  return SUPPORTED_PLATFORMS[platform] ?? null;
}

async function recordAudit(
  item: DistributionTrayItem,
  result: AdapterResult,
  durationMs: number,
): Promise<void> {
  try {
    await seoAutopilotRepo.recordAudit({
      tool: `distribution.publish.${item.platform}`,
      params: { itemId: item.id, slug: item.slug, language: item.language },
      success: result.ok,
      resultSize: result.publishedUrl ? result.publishedUrl.length : null,
      durationMs,
      errorMessage: result.error ?? null,
    });
  } catch (err) {
    logger.error("[distributionEngine] audit log failed", {
      err: err instanceof Error ? err.message : String(err),
      itemId: item.id,
    });
  }
}

export async function publishOne(itemId: number): Promise<PublishOneResult> {
  const item = await storage.getDistributionItemById(itemId);
  if (!item) {
    return { ok: false, itemId, error: "Item not found", statusCode: 404 };
  }

  if (item.status === "published") {
    return {
      ok: true,
      itemId,
      alreadyPublished: true,
      publishedUrl: item.publishedUrl ?? undefined,
      statusCode: 409,
    };
  }

  const adapter = pickAdapter(item.platform);
  if (!adapter) {
    logger.info("[distributionEngine] unsupported platform, skipping", {
      itemId, platform: item.platform,
    });
    return {
      ok: false,
      itemId,
      unsupported: true,
      error: `Platform "${item.platform}" not supported in Phase 1`,
      statusCode: 501,
    };
  }

  const started = Date.now();
  const result = await adapter.publish(item);
  const durationMs = Date.now() - started;

  await recordAudit(item, result, durationMs);

  if (result.ok && result.publishedUrl) {
    await storage.markDistributionPublished(itemId, result.publishedUrl);
    logger.info("[distributionEngine] published", {
      itemId, platform: item.platform, durationMs, url: result.publishedUrl,
    });
    return {
      ok: true,
      itemId,
      publishedUrl: result.publishedUrl,
      statusCode: result.statusCode ?? 200,
    };
  }

  const errorMessage = result.error ?? "Unknown adapter error";
  await storage.markDistributionFailed(itemId, errorMessage);
  logger.warn("[distributionEngine] publish failed", {
    itemId, platform: item.platform, durationMs, error: errorMessage,
  });
  return {
    ok: false,
    itemId,
    error: errorMessage,
    statusCode: result.statusCode ?? 500,
  };
}

export async function publishPending(opts: {
  limit?: number;
  platforms?: DistributionPlatform[];
} = {}): Promise<PublishPendingResult> {
  const supported = (Object.keys(SUPPORTED_PLATFORMS) as DistributionPlatform[]);
  const targetPlatforms = opts.platforms?.filter((p) => supported.includes(p)) ?? supported;

  const items = await storage.getPendingDistributions({
    limit: opts.limit ?? 25,
    platforms: targetPlatforms,
  });

  const summary: PublishPendingResult = {
    attempted: items.length,
    ok: 0,
    failed: 0,
    skipped: 0,
    results: [],
  };

  for (const item of items) {
    const result = await publishOne(item.id);
    summary.results.push(result);
    if (result.ok && !result.alreadyPublished) summary.ok++;
    else if (result.unsupported || result.alreadyPublished) summary.skipped++;
    else summary.failed++;
  }

  logger.info("[distributionEngine] publishPending completed", {
    attempted: summary.attempted, ok: summary.ok, failed: summary.failed, skipped: summary.skipped,
  });

  return summary;
}

export const __test__ = { SUPPORTED_PLATFORMS };
