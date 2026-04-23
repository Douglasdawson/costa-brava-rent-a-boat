import { onCLS, onLCP, onINP, onTTFB, onFCP } from "web-vitals";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function sendToGA4(metric: { name: string; value: number; id: string }) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "web_vitals",
      metric_name: metric.name,
      metric_value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
    });
  }
}

function sendToBeacon(metric: { name: string; value: number; id: string }) {
  if (typeof window === "undefined" || typeof navigator.sendBeacon !== "function") return;

  const page = window.location.pathname;
  const deviceType = window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
  const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const navigationType = navEntry?.type || "navigate";
  const connection = (navigator as unknown as Record<string, unknown>).connection as { effectiveType?: string } | undefined;
  const connectionType = connection?.effectiveType || "unknown";

  const data = JSON.stringify({
    page,
    name: metric.name,
    value: metric.name === "CLS" ? metric.value : Math.round(metric.value),
    rating: undefined, // server will classify
    deviceType,
    navigationType,
    connectionType,
  });

  navigator.sendBeacon("/api/cwv-beacon", new Blob([data], { type: "application/json" }));
}

function handleMetric(metric: { name: string; value: number; id: string }) {
  sendToGA4(metric);
  sendToBeacon(metric);
}

export function initWebVitals() {
  try {
    onCLS(handleMetric);
    onLCP(handleMetric);
    onINP(handleMetric);
    onTTFB(handleMetric);
    onFCP(handleMetric);
  } catch {
    // web-vitals not available
  }
}
