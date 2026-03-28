// server/seo/reports/sem.ts
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../../db";
import { seoReports } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { buildBriefing } from "../strategist/briefing";
import { sendTelegramMessage } from "../alerts/telegram";

const client = new Anthropic();

export async function generateSemReport(): Promise<void> {
  const briefing = await buildBriefing();

  logger.info("[SEO:Reports] Generating SEM report...");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Eres un experto en SEM (Search Engine Marketing) y Google Ads para un negocio de alquiler de barcos en Blanes, Costa Brava.

Analiza estos datos de Google Search Console y Analytics y genera un informe SEM accionable en español.

DATOS:
${JSON.stringify(briefing, null, 2)}

GENERA:

1. TOP 5 KEYWORDS PARA GOOGLE ADS
Para cada keyword con alto volumen de impresiones pero posicion organica > 10 (no rankea bien en organico):
- Keyword
- Impresiones mensuales estimadas
- Posicion organica actual
- Anuncio sugerido: titulo (max 30 chars) y descripcion (max 90 chars)
- Landing page recomendada (URL existente del sitio)
- CPC estimado (bajo/medio/alto)

2. KEYWORDS DONDE NO GASTAR (ya rankeas bien)
Keywords con posicion organica <= 5 donde no tiene sentido pagar por ads.

3. CRUCE SEO vs SEM
- Keywords que necesitan ads AHORA (posicion > 10, alto volumen)
- Keywords donde el SEO esta mejorando y pronto no necesitaran ads (posicion 6-10, tendencia ascendente)

4. OPORTUNIDADES ESTACIONALES
Basado en la temporada actual (abril-octubre = temporada, noviembre-marzo = fuera), que keywords son mas relevantes AHORA.

5. PRESUPUESTO DIARIO SUGERIDO
Estimacion del presupuesto diario para Google Ads basado en las 5 keywords prioritarias.

FORMATO: Texto plano conciso (max 800 palabras), listo para enviar por WhatsApp. Usa emojis para separar secciones. No uses markdown.`,
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
      data: briefing,
      sentVia: "telegram",
    });

    // Send via Telegram
    await sendTelegramMessage("Informe SEM (cada 5 días)", summary);

    logger.info("[SEO:Reports] SEM report generated and sent");
  } catch (error) {
    logger.error("[SEO:Reports] Failed to generate SEM report", { error: String(error) });
  }
}
