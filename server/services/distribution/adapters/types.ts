import type { DistributionTrayItem } from "@shared/schema";

export interface AdapterResult {
  ok: boolean;
  publishedUrl?: string;
  error?: string;
  statusCode?: number;
}

export interface PlatformAdapter {
  publish(item: DistributionTrayItem): Promise<AdapterResult>;
}
