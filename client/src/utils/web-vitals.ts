import { onCLS, onLCP, onINP } from "web-vitals";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
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

export function initWebVitals() {
  try {
    onCLS(sendToGA4);
    onLCP(sendToGA4);
    onINP(sendToGA4);
  } catch {
    // web-vitals not available
  }
}
