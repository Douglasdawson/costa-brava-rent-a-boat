import cron from "node-cron";
import { storage } from "../storage";
import {
  sendBookingReminder,
  sendThankYouEmail,
} from "./emailService";
import type { Booking, Boat } from "@shared/schema";

/**
 * Try to send a WhatsApp message. Returns true if sent, false if Twilio is not configured
 * or if sending fails. Never throws.
 */
async function trySendWhatsAppReminder(booking: Booking, boat: Boat): Promise<boolean> {
  try {
    // Dynamic import to avoid crashes when Twilio is not configured
    const { isTwilioConfigured, sendWhatsAppMessage } = await import("../whatsapp/twilioClient");

    if (!isTwilioConfigured()) {
      console.log("[Scheduler] Twilio not configured, skipping WhatsApp reminder");
      return false;
    }

    if (!booking.customerPhone) {
      console.log(`[Scheduler] No phone number for booking ${booking.id}, skipping WhatsApp`);
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
    console.error(`[Scheduler] WhatsApp reminder error for booking ${booking.id}:`, message);
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

    console.log(`[Scheduler] Found ${upcomingBookings.length} bookings needing reminders`);

    for (const booking of upcomingBookings) {
      try {
        // Fetch boat details and extras for the email template
        const boat = await storage.getBoat(booking.boatId);
        if (!boat) {
          console.error(`[Scheduler] Boat ${booking.boatId} not found for booking ${booking.id}`);
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
            console.error(`[Scheduler] Email reminder failed for booking ${booking.id}: ${emailResult.error}`);
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

        console.log(
          `[Scheduler] Reminder processed for booking ${booking.id}: email=${emailSent}, whatsapp=${whatsappSent}`
        );
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Scheduler] Error processing reminder for booking ${booking.id}:`, msg);
        // Continue with next booking
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Scheduler] Error in processReminders:", msg);
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

    console.log(`[Scheduler] Found ${completedBookings.length} bookings needing thank-you emails`);

    for (const booking of completedBookings) {
      try {
        // Skip if no email
        if (!booking.customerEmail) {
          // Mark as sent to avoid retrying
          await storage.updateBookingEmailStatus(booking.id, undefined, true);
          continue;
        }

        // Fetch boat details and extras for the email template
        const boat = await storage.getBoat(booking.boatId);
        if (!boat) {
          console.error(`[Scheduler] Boat ${booking.boatId} not found for booking ${booking.id}`);
          continue;
        }

        const extras = await storage.getBookingExtras(booking.id);
        const emailData = { booking, boat, extras };

        // Send thank-you email
        const emailResult = await sendThankYouEmail(emailData);

        if (emailResult.success) {
          // Also generate a proper discount code in the database for the repeat customer
          try {
            await storage.generateRepeatCustomerCode(booking.customerEmail, booking.id);
          } catch (discountError: unknown) {
            // Non-critical: the email already contains a code pattern, DB code is a bonus
            const msg = discountError instanceof Error ? discountError.message : "Unknown error";
            console.error(`[Scheduler] Error generating discount code for ${booking.customerEmail}:`, msg);
          }
        } else {
          console.error(`[Scheduler] Thank-you email failed for booking ${booking.id}: ${emailResult.error}`);
        }

        // Mark as sent regardless to prevent retries
        await storage.updateBookingEmailStatus(booking.id, undefined, true);

        console.log(
          `[Scheduler] Thank-you processed for booking ${booking.id}: email=${emailResult.success}`
        );
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Scheduler] Error processing thank-you for booking ${booking.id}:`, msg);
        // Continue with next booking
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Scheduler] Error in processThankYou:", msg);
  }
}

/**
 * Start all scheduled cron jobs.
 * Call this once during server startup.
 */
export function startScheduler(): void {
  console.log("[Scheduler] Starting scheduled services...");

  // Reminder job: run every hour at minute 0
  // Checks for confirmed bookings starting in 22-26 hours
  cron.schedule("0 * * * *", async () => {
    console.log("[Scheduler] Running reminder job...");
    await processReminders();
  });

  // Thank-you job: run every hour at minute 30
  // Checks for confirmed bookings that ended 22-26 hours ago
  cron.schedule("30 * * * *", async () => {
    console.log("[Scheduler] Running thank-you job...");
    await processThankYou();
  });

  console.log("[Scheduler] Scheduled services started: reminders (every hour at :00), thank-you (every hour at :30)");
}
