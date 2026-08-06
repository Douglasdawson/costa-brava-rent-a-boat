// Telegram reminders to review Click&Boat prices, one week before each season
// month starts.
//
// Why this exists: Click&Boat stores pricing periods WITHOUT a year
// (internally `2000-MM-DD`), so they repeat every season. The weekday/weekend
// split we build each year silently rots — next season those same dates fall on
// different weekdays, so the "weekday" blocks land on weekends and we charge
// the wrong price. Nothing in the platform warns about it.
import { SEASON_START_MONTH, SEASON_END_MONTH } from "@shared/constants";
import { sendTelegramMessage } from "../seo/alerts/telegram";
import { logger } from "../lib/logger";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Days of warning before the target month begins. */
const LEAD_DAYS = 7;

// Both fleets are priced on Click&Boat and both need the weekday split.
const LICENSED = ["Mingolla Brava 19", "Trimarchi 57S", "Pacific Craft 625"];
const UNLICENSED = [
  "Solar 450",
  "Remus 450",
  "Astec 480",
  "Astec 400 (oculto en C&B desde 08-2026; si se reactiva, crearle antes periodos de temporada)",
];

/** Civil date in Madrid, so the season and the day-of-month are the local ones. */
function madridDateParts(date: Date): { year: number; month: number; day: number } {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [year, month, day] = formatted.split("-").map(Number);
  return { year, month, day };
}

export interface PricingReminder {
  title: string;
  message: string;
}

function fleetList(): string {
  return (
    "CON LICENCIA (los que suelen ir flojos):\n" +
    LICENSED.map((b) => `· ${b}`).join("\n") +
    "\n\nSIN LICENCIA:\n" +
    UNLICENSED.map((b) => `· ${b}`).join("\n")
  );
}

/**
 * The reminder due on `date`, or null when there is nothing to say.
 *
 * Fires exactly LEAD_DAYS before the 1st of a season month: adding LEAD_DAYS to
 * today must land on a day 1. That way it works for 28/30/31-day months without
 * a per-month table, and it repeats every year on its own.
 */
export function buildPricingReminder(date: Date): PricingReminder | null {
  const { year, month, day } = madridDateParts(date);
  // Operate on plain civil components in UTC so DST shifts can't move the date.
  const target = new Date(Date.UTC(year, month - 1, day + LEAD_DAYS));
  if (target.getUTCDate() !== 1) return null;

  const targetMonth = target.getUTCMonth() + 1;
  if (targetMonth < SEASON_START_MONTH || targetMonth > SEASON_END_MONTH) return null;

  const name = MONTH_NAMES[targetMonth - 1];
  const isSeasonOpener = targetMonth === SEASON_START_MONTH;

  const rebuildWarning = isSeasonOpener
    ? "AVISO IMPORTANTE: arranca la temporada. Los periodos de Click&Boat se guardan sin año, " +
      "así que el troceado entre semana / fin de semana de la temporada pasada ha quedado desplazado: " +
      "los bloques que eran de lunes a viernes ahora caen en fines de semana y se cobraría el precio " +
      "equivocado. Hay que recalcularlo entero antes de aceptar reservas.\n\n" +
      "Cómo: fija primero los precios de la temporada en la web y luego pídele a Claude " +
      "\"regenera el troceo de Click&Boat con paridad web\" (skill precios-clickandboat). " +
      "Reconstruye los bloques L-V/finde con el calendario del año nuevo a precio web exacto " +
      "(el contrato prohíbe cobrar más caro en la plataforma) y verifica al releer que no " +
      "queden huecos ni solapes. Revisa también si la promoción de último minuto configurada " +
      "el año pasado sigue teniendo sentido.\n\n"
    : "";

  return {
    title: `Precios Click&Boat: revisar ${name}`,
    message:
      `${rebuildWarning}${name.charAt(0).toUpperCase()}${name.slice(1)} empieza en ${LEAD_DAYS} días. Toca decidir precios.\n\n` +
      `${fleetList()}\n\n` +
      "Si las reservas van flojas, lo habitual es bajar solo el precio entre semana y dejar los " +
      "fines de semana como están.\n\n" +
      `Para hacerlo, dime: "baja ${name} a X € entre semana", indicando si es para los de licencia, ` +
      "los sin licencia o todos.",
  };
}

/** Sends the reminder due today, if any. Returns true when a message went out. */
export async function notifyPricingReview(now: Date = new Date()): Promise<boolean> {
  const reminder = buildPricingReminder(now);
  if (!reminder) return false; // not the right day, or off-season
  const sent = await sendTelegramMessage(reminder.title, reminder.message);
  if (!sent) logger.warn("[PricingReview] Telegram send failed", { title: reminder.title });
  else logger.info("[PricingReview] Reminder sent", { title: reminder.title });
  return sent;
}
