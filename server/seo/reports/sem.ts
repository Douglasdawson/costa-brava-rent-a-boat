// server/seo/reports/sem.ts
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../../db";
import { seoReports } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { sendTelegramMessage } from "../alerts/telegram";
import { GoogleAnalyticsService } from "../../services/googleAnalyticsService";

const client = new Anthropic();

async function fetchSemData() {
  const ga = new GoogleAnalyticsService();
  const now = new Date();
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const startDate = fiveDaysAgo.toISOString().split("T")[0];
  const endDate = now.toISOString().split("T")[0];

  // Fetch data in parallel — these are the most relevant for SEM
  const [gscKeywords, gscPages, ga4Overview, ga4Traffic] = await Promise.allSettled([
    ga.fetchGSCKeywords(startDate, endDate, 50),
    ga.fetchGSCPages(startDate, endDate, 20),
    ga.fetchGA4Overview(startDate, endDate),
    ga.fetchGA4TrafficSources(startDate, endDate),
  ]);

  return {
    period: { start: startDate, end: endDate },
    keywords: gscKeywords.status === "fulfilled" ? gscKeywords.value : [],
    pages: gscPages.status === "fulfilled" ? gscPages.value : [],
    overview: ga4Overview.status === "fulfilled" ? ga4Overview.value : null,
    traffic: ga4Traffic.status === "fulfilled" ? ga4Traffic.value : [],
  };
}

export async function generateSemReport(): Promise<void> {
  logger.info("[SEO:Reports] Generating SEM report...");

  try {
    const data = await fetchSemData();

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Eres un experto en SEM (Search Engine Marketing) y Google Ads para un negocio de alquiler de barcos en Blanes, Costa Brava.

Analiza estos datos de Google Search Console y Analytics y genera un informe SEM accionable en español.

DATOS DEL PERIODO ${data.period.start} a ${data.period.end}:

KEYWORDS GSC (top 50 por clicks):
${JSON.stringify(data.keywords, null, 2)}

PAGINAS GSC (top 20 por clicks):
${JSON.stringify(data.pages, null, 2)}

RESUMEN GA4:
${JSON.stringify(data.overview, null, 2)}

FUENTES DE TRAFICO:
${JSON.stringify(data.traffic, null, 2)}

GENERA:

1. TOP 5 KEYWORDS PARA GOOGLE ADS
Para cada keyword con alto volumen de impresiones pero posicion organica > 10 (no rankea bien en organico):
- Keyword
- Impresiones en el periodo
- Posicion organica actual
- Anuncio sugerido: titulo (max 30 chars) y descripcion (max 90 chars)
- Landing page recomendada (URL existente del sitio)
- CPC estimado (bajo/medio/alto)

2. KEYWORDS DONDE NO GASTAR (ya rankeas bien)
Keywords con posicion organica <= 5 donde no tiene sentido pagar por ads.

3. CRUCE SEO vs SEM
- Keywords que necesitan ads AHORA (posicion > 10, alto volumen)
- Keywords donde el SEO esta mejorando y pronto no necesitaran ads (posicion 6-10)

4. OPORTUNIDADES ESTACIONALES
Basado en la temporada actual (abril-octubre = temporada alta, noviembre-marzo = fuera), que keywords son mas relevantes AHORA.

5. PRESUPUESTO DIARIO SUGERIDO
Estimacion del presupuesto diario para Google Ads basado en las 5 keywords prioritarias.

FORMATO: Texto plano conciso (max 800 palabras), listo para enviar por Telegram. Usa emojis para separar secciones. No uses markdown con asteriscos.`,
      }],
    });

    const summary = response.content[0].type === "text" ? response.content[0].text : "";

    const now = new Date();
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    await db.insert(seoReports).values({
      type: "sem",
      periodStart: fiveDaysAgo.toISOString().split("T")[0],
      periodEnd: now.toISOString().split("T")[0],
      summary,
      data,
      sentVia: "telegram",
    });

    // Send via Telegram
    await sendTelegramMessage("Informe SEM (cada 5 dias)", summary);

    logger.info("[SEO:Reports] SEM report generated and sent via Telegram");
  } catch (error) {
    logger.error("[SEO:Reports] Failed to generate SEM report", { error: String(error) });
    throw error;
  }
}
