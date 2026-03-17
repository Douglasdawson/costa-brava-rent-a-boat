/**
 * Abandoned Booking Recovery Service (B5)
 *
 * Detects bookings where a hold expired (deleted from bookings table by cleanupExpiredHolds)
 * or where bookingStatus changed to 'cancelled' before payment, then:
 * 1. Waits 1 hour after expiration
 * 2. Sends a recovery email with 5% discount code valid 48 hours
 * 3. Marks recoveryEmailSent = true to avoid duplicates
 *
 * NOTE: The existing cleanupExpiredHolds() DELETEs expired holds, so this service
 * targets cancelled bookings that were never paid — these represent abandoned carts.
 * We look for bookings cancelled within the last 1-2 hours that have an email.
 */

import {
  db, eq, and, gte, lte, sql, isNull, bookings, boats, discountCodes,
} from "../storage/base";
import { logger } from "../lib/logger";

interface AbandonedBooking {
  id: string;
  boatId: string;
  boatName: string;
  customerName: string;
  customerEmail: string;
  bookingDate: Date;
  startTime: Date;
  totalHours: number;
  language: string | null;
  tenantId: string | null;
}

/**
 * Find bookings eligible for recovery emails:
 * - bookingStatus = 'cancelled' (hold expired or user abandoned)
 * - paymentStatus = 'pending' (never paid)
 * - createdAt was 1-3 hours ago (give them time but not too long)
 * - recoveryEmailSent = false
 * - customerEmail is not null
 */
export async function getAbandonedBookings(tenantId?: string): Promise<AbandonedBooking[]> {
  const now = new Date();
  // Window: bookings cancelled 1-3 hours ago
  const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  const tenantFilter = tenantId
    ? sql` AND bk.tenant_id = ${tenantId}`
    : sql``;

  const { rows } = await db.execute(sql`
    SELECT
      bk.id,
      bk.boat_id,
      b.name AS boat_name,
      bk.customer_name,
      bk.customer_email,
      bk.booking_date,
      bk.start_time,
      bk.total_hours,
      bk.language,
      bk.tenant_id
    FROM bookings bk
    JOIN boats b ON b.id = bk.boat_id
    WHERE bk.booking_status = 'cancelled'
      AND bk.payment_status = 'pending'
      AND bk.recovery_email_sent = false
      AND bk.customer_email IS NOT NULL
      AND bk.created_at >= ${windowStart}
      AND bk.created_at <= ${windowEnd}
      ${tenantFilter}
    ORDER BY bk.created_at ASC
    LIMIT 50
  `);

  return (rows as unknown as Array<{
    id: string;
    boat_id: string;
    boat_name: string;
    customer_name: string;
    customer_email: string;
    booking_date: Date;
    start_time: Date;
    total_hours: number;
    language: string | null;
    tenant_id: string | null;
  }>).map(row => ({
    id: row.id,
    boatId: row.boat_id,
    boatName: row.boat_name,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    bookingDate: new Date(row.booking_date),
    startTime: new Date(row.start_time),
    totalHours: row.total_hours,
    language: row.language,
    tenantId: row.tenant_id,
  }));
}

/**
 * Generate a 5% recovery discount code valid for 48 hours.
 * Code format: RECOVER-{6-char hash}
 */
export async function generateRecoveryDiscountCode(
  email: string,
  bookingId: string,
  tenantId?: string,
): Promise<string> {
  const emailHash = email.toLowerCase().trim().split("").reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }, 0);
  const hashStr = Math.abs(emailHash).toString(36).toUpperCase().slice(0, 4).padEnd(4, "X");
  const timePart = Date.now().toString(36).toUpperCase().slice(-3);
  const code = `RECOVER-${hashStr}${timePart}`;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  await db
    .insert(discountCodes)
    .values({
      code,
      discountPercent: 5,
      maxUses: 1,
      customerEmail: email.toLowerCase().trim(),
      isActive: true,
      expiresAt,
      ...(tenantId ? { tenantId } : {}),
    })
    .onConflictDoNothing(); // In case of hash collision

  return code;
}

/**
 * Mark a booking as having had a recovery email sent.
 */
export async function markRecoveryEmailSent(bookingId: string): Promise<void> {
  await db
    .update(bookings)
    .set({ recoveryEmailSent: true })
    .where(eq(bookings.id, bookingId));
}

/**
 * Send a recovery email for an abandoned booking.
 * Uses SendGrid via dynamic import to avoid crashes when not configured.
 */
async function sendRecoveryEmail(
  booking: AbandonedBooking,
  discountCode: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Dynamic import to avoid issues when SendGrid is not configured
    const sgMail = (await import("@sendgrid/mail")).default;
    const { sendgridBreaker } = await import("../lib/circuitBreaker");

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return { success: false, error: "SendGrid not configured" };
    }
    sgMail.setApiKey(apiKey);

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "costabravarentaboat@gmail.com";

    const dateStr = booking.startTime.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const bookingUrl = "https://costabravarentaboat.com";

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background-color:#f8fafc; font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding:32px 24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px;">Todavia quieres navegar?</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px; color:#334155; font-size:16px; line-height:1.6;">
                Hola ${booking.customerName},
              </p>
              <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
                Vimos que estuviste a punto de reservar el <strong>${booking.boatName}</strong>
                para el ${dateStr}. Entendemos que a veces la vida se interpone.
              </p>

              <div style="background-color:#f0f9ff; border-radius:8px; padding:20px; margin:20px 0; text-align:center;">
                <p style="margin:0 0 8px; color:#0c4a6e; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Oferta especial para ti</p>
                <p style="margin:0 0 12px; color:#1e3a5f; font-size:18px; font-weight:700;">5% de descuento en tu reserva</p>
                <div style="background-color:rgba(37,99,235,0.1); border:2px dashed #2563eb; border-radius:6px; padding:12px; display:inline-block;">
                  <span style="color:#2563eb; font-size:22px; font-weight:700; letter-spacing:2px;">${discountCode}</span>
                </div>
                <p style="margin:12px 0 0; color:#64748b; font-size:12px;">Valido durante 48 horas</p>
              </div>

              <div style="text-align:center; margin:28px 0;">
                <a href="${bookingUrl}" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:14px 36px; border-radius:8px; font-size:16px; font-weight:700;">Completar mi reserva</a>
              </div>

              <p style="margin:20px 0 0; color:#94a3b8; font-size:13px; line-height:1.5; text-align:center;">
                Si tienes alguna duda, contactanos por WhatsApp al +34 611 500 372
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f1f5f9; padding:16px 24px; text-align:center;">
              <p style="margin:0; color:#94a3b8; font-size:12px;">Costa Brava Rent a Boat - Puerto de Blanes</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendgridBreaker.call(() => sgMail.send({
      to: booking.customerEmail,
      from: { email: fromEmail, name: "Costa Brava Rent a Boat" },
      subject: `${booking.customerName}, tu barco te espera - 5% de descuento`,
      html,
    }));

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Main processing function: find abandoned bookings, generate discount codes,
 * send recovery emails, and mark as sent.
 * Designed to be called by the scheduler every 30 minutes.
 */
export async function processAbandonedBookings(): Promise<void> {
  try {
    const abandoned = await getAbandonedBookings();

    if (abandoned.length === 0) {
      return;
    }

    logger.info("[AbandonedBooking] Found abandoned bookings to recover", { count: abandoned.length });

    for (const booking of abandoned) {
      try {
        // Generate a 5% discount code
        const code = await generateRecoveryDiscountCode(
          booking.customerEmail,
          booking.id,
          booking.tenantId ?? undefined,
        );

        // Send recovery email
        const result = await sendRecoveryEmail(booking, code);

        if (result.success) {
          logger.info("[AbandonedBooking] Recovery email sent", {
            bookingId: booking.id,
            email: booking.customerEmail,
            discountCode: code,
          });
        } else {
          logger.error("[AbandonedBooking] Recovery email failed", {
            bookingId: booking.id,
            email: booking.customerEmail,
            error: result.error,
          });
        }

        // Mark as sent regardless to prevent retries
        await markRecoveryEmailSent(booking.id);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error("[AbandonedBooking] Error processing booking", {
          bookingId: booking.id,
          error: msg,
        });
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("[AbandonedBooking] Error in processAbandonedBookings", { error: msg });
  }
}
