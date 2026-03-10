import cron from "node-cron";
import { storage } from "../storage";
import {
  sendBookingReminder,
  sendThankYouEmail,
} from "./emailService";
import { runAutopilotPipeline, publishNextDraft, getConfig } from "./blogAutopilot.js";
import type { Booking, Boat } from "@shared/schema";
import { logger } from "../lib/logger";

/**
 * Try to send a WhatsApp message. Returns true if sent, false if Twilio is not configured
 * or if sending fails. Never throws.
 */
async function trySendWhatsAppReminder(booking: Booking, boat: Boat): Promise<boolean> {
  try {
    // Dynamic import to avoid crashes when Twilio is not configured
    const { isTwilioConfigured, sendWhatsAppMessage } = await import("../whatsapp/twilioClient");

    if (!isTwilioConfigured()) {
      logger.info("Twilio not configured, skipping WhatsApp reminder");
      return false;
    }

    if (!booking.customerPhone) {
      logger.info("No phone number for booking, skipping WhatsApp", { bookingId: booking.id });
      return false;
    }

    const date = booking.startTime.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const time = booking.startTime.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Madrid",
    });

    const message = [
      `Hola ${booking.customerName}!`,
      ``,
      `Te recordamos que tu alquiler del ${boat.name} es manana:`,
      `Fecha: ${date}`,
      `Hora: ${time}`,
      `Duracion: ${booking.totalHours}h`,
      ``,
      `Punto de encuentro: Puerto de Blanes`,
      `Llega 15 minutos antes de la hora de salida.`,
      ``,
      `Recuerda traer: proteccion solar, gafas de sol y ropa comoda.`,
      ``,
      `Ante cualquier duda: +34 611 500 372`,
      ``,
      `Costa Brava Rent a Boat`,
    ].join("\n");

    await sendWhatsAppMessage(booking.customerPhone, message);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Scheduler] WhatsApp reminder error for booking ${booking.id}`, { error: message });
    return false;
  }
}

/**
 * Try to send a WhatsApp thank-you message 24h after the trip.
 * Returns true if sent, false if Twilio is not configured or if sending fails. Never throws.
 */
async function trySendWhatsAppThankYou(booking: Booking): Promise<boolean> {
  try {
    const { isTwilioConfigured, sendWhatsAppMessage } = await import("../whatsapp/twilioClient");

    if (!isTwilioConfigured()) {
      logger.info("Twilio not configured, skipping WhatsApp thank-you");
      return false;
    }

    if (!booking.customerPhone) {
      logger.info("No phone number for booking, skipping WhatsApp thank-you", { bookingId: booking.id });
      return false;
    }

    const message = [
      `Hola ${booking.customerName}!`,
      ``,
      `Esperamos que tu salida de ayer haya sido increible.`,
      ``,
      `Si lo disfrutaste, te agradeceriamos mucho que nos dejaras una resena en Google:`,
      `https://g.page/r/costabravarentaboat/review`,
      ``,
      `Como cliente especial, tienes un descuento exclusivo para tu proxima reserva. Solo preguntanos!`,
      ``,
      `Un abrazo, Costa Brava Rent a Boat`,
    ].join("\n");

    await sendWhatsAppMessage(booking.customerPhone, message);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Scheduler] WhatsApp thank-you error for booking ${booking.id}`, { error: message });
    return false;
  }
}

/**
 * Process upcoming bookings and send reminder emails + WhatsApp messages.
 * Runs every hour, targets bookings starting in ~24 hours (22-26h window).
 */
async function processReminders(): Promise<void> {
  try {
    const upcomingBookings = await storage.getUpcomingBookingsForReminder(24);

    if (upcomingBookings.length === 0) {
      return;
    }

    logger.info("Found bookings needing reminders", { count: upcomingBookings.length });

    for (const booking of upcomingBookings) {
      try {
        // Fetch boat details and extras for the email template
        const boat = await storage.getBoat(booking.boatId);
        if (!boat) {
          logger.error(`[Scheduler] Boat ${booking.boatId} not found for booking ${booking.id}`);
          continue;
        }

        const extras = await storage.getBookingExtras(booking.id);
        const emailData = { booking, boat, extras };

        // Send reminder email (if customer has email)
        let emailSent = false;
        if (booking.customerEmail) {
          const emailResult = await sendBookingReminder(emailData);
          emailSent = emailResult.success;
          if (!emailResult.success) {
            logger.error(`[Scheduler] Email reminder failed for booking ${booking.id}`, { error: emailResult.error ?? "unknown" });
          }
        }

        // Send WhatsApp reminder (if not already sent)
        let whatsappSent = booking.whatsappReminderSent;
        if (!booking.whatsappReminderSent) {
          whatsappSent = await trySendWhatsAppReminder(booking, boat);
        }

        // Mark as sent even if only one channel succeeded, to avoid spamming
        // If both failed, we still mark to prevent retries every hour
        await storage.updateBookingEmailStatus(booking.id, true, undefined);

        if (whatsappSent && !booking.whatsappReminderSent) {
          await storage.updateBookingWhatsAppStatus(booking.id, undefined, true);
        }

        logger.info("Reminder processed for booking", { bookingId: booking.id, emailSent, whatsappSent });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error(`[Scheduler] Error processing reminder for booking ${booking.id}`, { error: msg });
        // Continue with next booking
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Scheduler] Error in processReminders", { error: msg });
  }
}

/**
 * Process completed bookings and send thank-you emails with review request + discount code.
 * Runs every hour, targets bookings that ended ~24 hours ago (22-26h window).
 */
async function processThankYou(): Promise<void> {
  try {
    const completedBookings = await storage.getCompletedBookingsForThankYou(24);

    if (completedBookings.length === 0) {
      return;
    }

    logger.info("Found bookings needing thank-you emails", { count: completedBookings.length });

    for (const booking of completedBookings) {
      try {
        // Attempt WhatsApp thank-you regardless of email availability
        let waThankYouSentThisRun = false;
        if (!booking.whatsappThankYouSent) {
          waThankYouSentThisRun = await trySendWhatsAppThankYou(booking);
          if (waThankYouSentThisRun) {
            await storage.updateBookingWhatsAppThankYouStatus(booking.id, true);
          }
        }

        // Skip email if no address, but WhatsApp was already attempted above
        if (!booking.customerEmail) {
          await storage.updateBookingEmailStatus(booking.id, undefined, true);
          continue;
        }

        // Fetch boat details and extras for the email template
        const boat = await storage.getBoat(booking.boatId);
        if (!boat) {
          logger.error(`[Scheduler] Boat ${booking.boatId} not found for booking ${booking.id}`);
          continue;
        }

        const extras = await storage.getBookingExtras(booking.id);
        const emailData = { booking, boat, extras };

        // Generate the discount code in DB first, then pass to email
        let discountCode = "REPEAT-GIFT";
        try {
          const codeRecord = await storage.generateRepeatCustomerCode(booking.customerEmail, booking.id);
          discountCode = codeRecord.code;
        } catch (discountError: unknown) {
          const msg = discountError instanceof Error ? discountError.message : "Unknown error";
          logger.error(`[Scheduler] Error generating discount code for ${booking.customerEmail}`, { error: msg });
        }

        // Send thank-you email with the real discount code
        const emailResult = await sendThankYouEmail(emailData, discountCode);

        if (!emailResult.success) {
          logger.error(`[Scheduler] Thank-you email failed for booking ${booking.id}`, { error: emailResult.error ?? "unknown" });
        }

        // Mark email as sent regardless to prevent retries
        await storage.updateBookingEmailStatus(booking.id, undefined, true);

        logger.info("Thank-you processed for booking", { bookingId: booking.id, emailSent: emailResult.success, whatsappSent: waThankYouSentThisRun });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error(`[Scheduler] Error processing thank-you for booking ${booking.id}`, { error: msg });
        // Continue with next booking
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Scheduler] Error in processThankYou", { error: msg });
  }
}

/**
 * Start all scheduled cron jobs.
 * Call this once during server startup.
 */
export function startScheduler(): void {
  logger.info("Starting scheduled services");

  // Reminder job: run every hour at minute 0
  // Checks for confirmed bookings starting in 22-26 hours
  cron.schedule("0 * * * *", async () => {
    logger.info("Running reminder job");
    await processReminders();
  });

  // Thank-you job: run every hour at minute 30
  // Checks for confirmed bookings that ended 22-26 hours ago
  cron.schedule("30 * * * *", async () => {
    logger.info("Running thank-you job");
    await processThankYou();
  });

  // Cleanup expired holds every 5 minutes to free blocked availability
  cron.schedule("*/5 * * * *", async () => {
    try {
      const cleaned = await storage.cleanupExpiredHolds();
      if (cleaned > 0) {
        logger.info("Cleaned up expired holds", { count: cleaned });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] Error cleaning expired holds", { error: msg });
    }
  });

  // Auto-complete confirmed bookings whose end time has passed (every hour at :45)
  // Runs after the thank-you job (:30) so thank-you emails are sent before status changes
  cron.schedule("45 * * * *", async () => {
    try {
      const count = await storage.autoCompleteBookings();
      if (count > 0) {
        logger.info("Auto-completed bookings", { count });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] Auto-complete error", { error: message });
    }
  });

  // Blog autopilot: generate new posts (schedule from config, default: Mon/Wed/Fri 9am)
  (async () => {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        logger.info("ANTHROPIC_API_KEY not set, blog autopilot disabled");
        return;
      }
      const config = await getConfig();
      if (!config.isEnabled) {
        logger.info("Blog autopilot is disabled in config");
        return;
      }
      cron.schedule(config.cronSchedule, async () => {
        logger.info("Running blog autopilot");
        const result = await runAutopilotPipeline();
        if (result.success) {
          logger.info("Blog autopilot success", { topic: result.topic, seoScore: result.seoScore });
        } else {
          logger.info("Blog autopilot skipped/failed", { error: result.error });
        }
      });
      logger.info("Blog autopilot scheduled", { cronSchedule: config.cronSchedule });
    } catch (error) {
      logger.error("[Scheduler] Failed to initialize blog autopilot", { error: error instanceof Error ? error.message : String(error) });
    }
  })();

  // Blog: publish 1 draft every Monday at 9am
  cron.schedule("0 9 * * 1", async () => {
    try {
      const published = await publishNextDraft();
      if (published > 0) {
        logger.info("Weekly blog draft published");
      }
    } catch (error) {
      logger.error("[Scheduler] Blog publish error", { error: error instanceof Error ? error.message : String(error) });
    }
  });

  logger.info("Scheduled services started: reminders (:00), thank-you (:30), hold cleanup (every 5min), auto-complete (:45), blog autopilot (config), blog publish (Mon 9am)");
}
