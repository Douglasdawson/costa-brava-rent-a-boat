// server/seo/exportBookingStats.ts
// Generates booking-stats.md daily for the marketing/operations team.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../db";
import { bookings, boats } from "../../shared/schema";
import { and, eq, gte, lte, inArray } from "drizzle-orm";
import { logger } from "../lib/logger";

function fmtNum(n: number): string {
  return n.toLocaleString("es-ES");
}

function fmtEur(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR";
}

export async function exportBookingStats(): Promise<void> {
  try {
    const now = new Date();
    const ts = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStart = new Date(yesterday);
    yStart.setHours(0, 0, 0, 0);
    const yEnd = new Date(yesterday);
    yEnd.setHours(23, 59, 59, 999);

    // Current month range
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Previous month range
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Fetch all boats
    const allBoats = await db.select({ id: boats.id, name: boats.name }).from(boats).where(eq(boats.isActive, true));
    const boatNames = new Map(allBoats.map((b) => [b.id, b.name]));

    const confirmedStatuses = ["confirmed", "completed"];

    // Yesterday's bookings
    const yesterdayBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.startTime, yStart),
          lte(bookings.startTime, yEnd),
          inArray(bookings.bookingStatus, confirmedStatuses)
        )
      );

    // Current month bookings
    const currentMonthBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.startTime, monthStart),
          lte(bookings.startTime, monthEnd),
          inArray(bookings.bookingStatus, confirmedStatuses)
        )
      );

    // Previous month bookings
    const prevMonthBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.startTime, prevMonthStart),
          lte(bookings.startTime, prevMonthEnd),
          inArray(bookings.bookingStatus, confirmedStatuses)
        )
      );

    // Revenue calculations
    const currentRevenue = currentMonthBookings.reduce(
      (sum, b) => sum + parseFloat(b.totalAmount || "0"), 0
    );
    const prevRevenue = prevMonthBookings.reduce(
      (sum, b) => sum + parseFloat(b.totalAmount || "0"), 0
    );
    const revDiff = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Occupancy: count hours booked per boat this month
    // Available hours per day per boat: assume 10h (9:00-19:00)
    const daysInMonth = monthEnd.getDate();
    const daysElapsed = Math.min(now.getDate(), daysInMonth);
    const availableHoursPerBoat = daysElapsed * 10;

    const boatStats = new Map<string, { hours: number; bookings: number; revenue: number }>();
    for (const boat of allBoats) {
      boatStats.set(boat.id, { hours: 0, bookings: 0, revenue: 0 });
    }

    for (const b of currentMonthBookings) {
      const stat = boatStats.get(b.boatId);
      if (stat) {
        stat.hours += b.totalHours || 0;
        stat.bookings += 1;
        stat.revenue += parseFloat(b.totalAmount || "0");
      }
    }

    // Demand ranking
    const boatDemand = Array.from(boatStats.entries())
      .map(([id, stat]) => ({
        id,
        name: boatNames.get(id) || id,
        ...stat,
        occupancy: availableHoursPerBoat > 0 ? (stat.hours / availableHoursPerBoat) * 100 : 0,
      }))
      .sort((a, b) => b.hours - a.hours);

    // Format dates
    const yDateStr = yesterday.toISOString().split("T")[0];
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const currentMonthName = monthNames[now.getMonth()];
    const prevMonthName = monthNames[(now.getMonth() + 11) % 12];

    const lines: string[] = [
      `# Booking Stats — Costa Brava Rent a Boat`,
      ``,
      `**Ultima actualizacion:** ${ts}`,
      ``,
      `---`,
      ``,
      `## Reservas de Ayer (${yDateStr})`,
      ``,
    ];

    if (yesterdayBookings.length === 0) {
      lines.push(`*No hubo reservas confirmadas ayer.*`, ``);
    } else {
      lines.push(
        `| # | Barco | Duracion | Personas | Total |`,
        `|---|-------|----------|----------|-------|`,
      );
      yesterdayBookings.forEach((b, i) => {
        const name = boatNames.get(b.boatId) || b.boatId;
        lines.push(
          `| ${i + 1} | ${name} | ${b.totalHours}h | ${b.numberOfPeople} | ${fmtEur(parseFloat(b.totalAmount || "0"))} |`
        );
      });
      const yTotal = yesterdayBookings.reduce((s, b) => s + parseFloat(b.totalAmount || "0"), 0);
      lines.push(``, `**Total ayer:** ${fmtEur(yTotal)} (${yesterdayBookings.length} reservas)`);
    }

    lines.push(
      ``,
      `---`,
      ``,
      `## Revenue Mensual`,
      ``,
      `| Metrica | ${currentMonthName} | ${prevMonthName} | Cambio |`,
      `|---------|${"-".repeat(currentMonthName.length + 2)}|${"-".repeat(prevMonthName.length + 2)}|--------|`,
      `| Revenue | ${fmtEur(currentRevenue)} | ${fmtEur(prevRevenue)} | ${revDiff >= 0 ? "+" : ""}${revDiff.toFixed(1)}% |`,
      `| Reservas | ${fmtNum(currentMonthBookings.length)} | ${fmtNum(prevMonthBookings.length)} | ${currentMonthBookings.length - prevMonthBookings.length >= 0 ? "+" : ""}${currentMonthBookings.length - prevMonthBookings.length} |`,
      ``,
      `*Nota: ${currentMonthName} incluye datos hasta hoy (dia ${daysElapsed} de ${daysInMonth}).*`,
      ``,
      `---`,
      ``,
      `## Ocupacion por Barco (${currentMonthName}, hasta hoy)`,
      ``,
      `| Barco | Reservas | Horas | Ocupacion | Revenue |`,
      `|-------|----------|-------|-----------|---------|`,
    );

    for (const b of boatDemand) {
      const bar = b.occupancy >= 50 ? "***" : b.occupancy >= 25 ? "**" : "";
      lines.push(
        `| ${b.name} | ${fmtNum(b.bookings)} | ${fmtNum(b.hours)}h | ${b.occupancy.toFixed(1)}% ${bar} | ${fmtEur(b.revenue)} |`
      );
    }

    // Most/least demanded
    const mostDemanded = boatDemand[0];
    const leastDemanded = boatDemand[boatDemand.length - 1];

    lines.push(
      ``,
      `**Mas demandado:** ${mostDemanded?.name || "-"} (${mostDemanded?.hours || 0}h, ${mostDemanded?.occupancy.toFixed(1) || 0}%)`,
      `**Menos demandado:** ${leastDemanded?.name || "-"} (${leastDemanded?.hours || 0}h, ${leastDemanded?.occupancy.toFixed(1) || 0}%)`,
      ``,
      `---`,
      ``,
      `*Generado automaticamente cada dia a las 6:00. Datos del sistema de reservas.*`,
      ``,
    );

    const outPath = path.resolve(process.cwd(), "booking-stats.md");
    await writeFile(outPath, lines.join("\n"), "utf-8");
    logger.info(`[Booking-Export] Written booking-stats.md`);
  } catch (error) {
    logger.error("[Booking-Export] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
