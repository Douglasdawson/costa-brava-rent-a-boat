import sgMail from "@sendgrid/mail";
import type { Booking, Boat, BookingExtra } from "@shared/schema";

// Lazy initialization for SendGrid
let initialized = false;

function initSendGrid(): boolean {
  if (!initialized && process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    initialized = true;
  }
  return initialized;
}

function getFromEmail(): string {
  return process.env.SENDGRID_FROM_EMAIL || "costabravarentboat@gmail.com";
}

interface EmailResult {
  success: boolean;
  error?: string;
}

// Booking data enriched with boat info and extras for email templates
interface BookingEmailData {
  booking: Booking;
  boat: Boat;
  extras: BookingExtra[];
}

// ===== HTML EMAIL TEMPLATE HELPERS =====

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f7fa; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding:28px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:0.5px;">Costa Brava Rent a Boat</h1>
              <p style="margin:6px 0 0; color:#93c5fd; font-size:14px;">Puerto de Blanes, Costa Brava</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:24px 32px; border-top:1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 8px; color:#475569; font-size:14px; font-weight:600;">Costa Brava Rent a Boat</p>
                    <p style="margin:0 0 4px; color:#64748b; font-size:13px;">Puerto de Blanes, Girona, Costa Brava</p>
                    <p style="margin:0 0 4px; color:#64748b; font-size:13px;">Tel: <a href="tel:+34611500372" style="color:#2563eb; text-decoration:none;">+34 611 500 372</a></p>
                    <p style="margin:0 0 12px; color:#64748b; font-size:13px;">Email: <a href="mailto:costabravarentboat@gmail.com" style="color:#2563eb; text-decoration:none;">costabravarentboat@gmail.com</a></p>
                    <p style="margin:0; color:#94a3b8; font-size:11px;">www.costabravarentaboat.app</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

function bookingDetailsTable(data: BookingEmailData): string {
  const { booking, boat, extras } = data;

  const extrasHtml = extras.length > 0
    ? extras.map(e => `<tr>
        <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">Extra: ${e.extraName}</td>
        <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${parseFloat(e.extraPrice).toFixed(2)} EUR</td>
      </tr>`).join("")
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border-radius:8px; overflow:hidden; margin:16px 0;">
    <tr>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; border-bottom:1px solid #e2e8f0; background-color:#eff6ff;">Barco</td>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; border-bottom:1px solid #e2e8f0; background-color:#eff6ff; text-align:right;">${boat.name}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">Fecha</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${formatDate(booking.startTime)}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">Horario</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">Duracion</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${booking.totalHours} hora${booking.totalHours > 1 ? "s" : ""}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">Personas</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${booking.numberOfPeople}</td>
    </tr>
    ${extrasHtml}
    <tr>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:15px; font-weight:700; border-top:2px solid #2563eb;">Total</td>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:15px; font-weight:700; border-top:2px solid #2563eb; text-align:right;">${parseFloat(booking.totalAmount).toFixed(2)} EUR</td>
    </tr>
  </table>`;
}

// ===== EMAIL SENDING FUNCTIONS =====

/**
 * Send booking confirmation email after a booking is confirmed.
 */
export async function sendBookingConfirmation(data: BookingEmailData): Promise<EmailResult> {
  if (!initSendGrid()) {
    console.log("[Email] SendGrid not configured, skipping booking confirmation email");
    return { success: false, error: "SendGrid not configured" };
  }

  const { booking } = data;

  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">Reserva confirmada</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      Hola ${booking.customerName},<br>
      Tu reserva ha sido confirmada. Aqui tienes los detalles:
    </p>

    ${bookingDetailsTable(data)}

    <div style="background-color:#eff6ff; border-left:4px solid #2563eb; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#1e3a5f; font-size:14px; font-weight:600;">Punto de encuentro</p>
      <p style="margin:0; color:#475569; font-size:14px;">Puerto de Blanes, Costa Brava, Girona</p>
      <p style="margin:8px 0 0; color:#475569; font-size:13px;">Presentate <strong>15 minutos antes</strong> de la hora de salida.</p>
    </div>

    <div style="background-color:#f0fdf4; border-left:4px solid #22c55e; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#166534; font-size:14px; font-weight:600;">Contacto</p>
      <p style="margin:0; color:#475569; font-size:14px;">Telefono: <a href="tel:+34611500372" style="color:#2563eb;">+34 611 500 372</a></p>
      <p style="margin:4px 0 0; color:#475569; font-size:14px;">Email: <a href="mailto:costabravarentboat@gmail.com" style="color:#2563eb;">costabravarentboat@gmail.com</a></p>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5;">
      Gracias por confiar en nosotros. Nos vemos en el puerto.
    </p>
  `;

  try {
    await sgMail.send({
      to: booking.customerEmail,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `Reserva confirmada - ${data.boat.name} - ${formatDate(booking.startTime)}`,
      html: emailWrapper(content),
    });

    console.log(`[Email] Booking confirmation sent to ${booking.customerEmail} for booking ${booking.id}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Error sending booking confirmation to ${booking.customerEmail}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Send booking reminder email 24h before the rental.
 */
export async function sendBookingReminder(data: BookingEmailData): Promise<EmailResult> {
  if (!initSendGrid()) {
    console.log("[Email] SendGrid not configured, skipping booking reminder email");
    return { success: false, error: "SendGrid not configured" };
  }

  const { booking } = data;

  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">Recordatorio: tu reserva es manana</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      Hola ${booking.customerName},<br>
      Te recordamos que tu alquiler de barco es <strong>manana</strong>. Aqui tienes los detalles:
    </p>

    ${bookingDetailsTable(data)}

    <div style="background-color:#eff6ff; border-left:4px solid #2563eb; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#1e3a5f; font-size:14px; font-weight:600;">Punto de encuentro</p>
      <p style="margin:0; color:#475569; font-size:14px;">Puerto de Blanes, Costa Brava, Girona</p>
      <p style="margin:8px 0 0; color:#475569; font-size:13px;">Presentate <strong>15 minutos antes</strong> de la hora de salida.</p>
    </div>

    <div style="background-color:#fefce8; border-left:4px solid #eab308; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 8px; color:#854d0e; font-size:14px; font-weight:600;">Consejos para tu experiencia</p>
      <ul style="margin:0; padding:0 0 0 18px; color:#475569; font-size:14px; line-height:1.8;">
        <li>Lleva proteccion solar y gafas de sol</li>
        <li>Viste ropa comoda y calzado que se pueda mojar</li>
        <li>Trae una toalla y ropa de repuesto</li>
        <li>Puedes traer comida y bebida a bordo</li>
        <li>Consulta la prevision meteorologica antes de salir</li>
      </ul>
    </div>

    <div style="background-color:#fef2f2; border-left:4px solid #ef4444; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#991b1b; font-size:14px; font-weight:600;">Numero de emergencia</p>
      <p style="margin:0; color:#475569; font-size:14px;">En caso de cualquier incidencia, llamanos al: <a href="tel:+34611500372" style="color:#2563eb; font-weight:600;">+34 611 500 372</a></p>
    </div>

    <div style="background-color:#f0fdf4; border-left:4px solid #22c55e; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#166534; font-size:14px; font-weight:600;">Aparcamiento</p>
      <p style="margin:0; color:#475569; font-size:14px;">Hay aparcamiento disponible cerca del puerto de Blanes. En temporada alta, recomendamos llegar con tiempo para encontrar plaza.</p>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5;">
      Estamos deseando verte manana. Si tienes alguna pregunta, no dudes en contactarnos.
    </p>
  `;

  try {
    await sgMail.send({
      to: booking.customerEmail,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `Recordatorio: tu alquiler de barco es manana - ${data.boat.name}`,
      html: emailWrapper(content),
    });

    console.log(`[Email] Booking reminder sent to ${booking.customerEmail} for booking ${booking.id}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Error sending booking reminder to ${booking.customerEmail}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Send thank-you email 24h after the rental with Google Review link and discount code.
 * @param discountCode - The actual discount code stored in the database
 */
export async function sendThankYouEmail(data: BookingEmailData, discountCode: string): Promise<EmailResult> {
  if (!initSendGrid()) {
    console.log("[Email] SendGrid not configured, skipping thank-you email");
    return { success: false, error: "SendGrid not configured" };
  }

  const { booking } = data;

  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }
  const googleReviewUrl = "https://search.google.com/local/writereview?placeid=ChIJrTRWOdA0uxIR_vCCNfbFNpE";

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">Gracias por navegar con nosotros</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      Hola ${booking.customerName},<br>
      Esperamos que disfrutaras de tu experiencia a bordo del <strong>${data.boat.name}</strong>.
      Para nosotros ha sido un placer tenerte como cliente.
    </p>

    <!-- Google Review CTA -->
    <div style="background-color:#eff6ff; border-radius:8px; padding:24px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 8px; color:#1e3a5f; font-size:16px; font-weight:600;">Tu opinion nos importa</p>
      <p style="margin:0 0 16px; color:#475569; font-size:14px; line-height:1.5;">
        Si disfrutaste de la experiencia, nos encantaria que compartieras tu opinion en Google.
        Nos ayuda mucho a seguir mejorando.
      </p>
      <a href="${googleReviewUrl}" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:15px; font-weight:600;">Dejar una resena en Google</a>
    </div>

    <!-- Discount Code -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); border-radius:8px; padding:24px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 4px; color:#93c5fd; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Regalo exclusivo para ti</p>
      <p style="margin:0 0 12px; color:#ffffff; font-size:18px; font-weight:700;">10% de descuento en tu proxima reserva</p>
      <div style="background-color:rgba(255,255,255,0.15); border:2px dashed rgba(255,255,255,0.4); border-radius:6px; padding:12px; display:inline-block;">
        <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:2px;">${discountCode}</span>
      </div>
      <p style="margin:12px 0 0; color:#bfdbfe; font-size:12px;">Introduce este codigo al hacer tu proxima reserva en nuestra web.</p>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="https://costabravarentaboat.app" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:15px; font-weight:600;">Reservar de nuevo</a>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5; text-align:center;">
      Esperamos verte de nuevo pronto en la Costa Brava.
    </p>
  `;

  try {
    await sgMail.send({
      to: booking.customerEmail,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `Gracias por navegar con nosotros, ${booking.customerName}!`,
      html: emailWrapper(content),
    });

    console.log(`[Email] Thank-you email sent to ${booking.customerEmail} for booking ${booking.id} (discount: ${discountCode})`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Error sending thank-you email to ${booking.customerEmail}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Send pre-season promotional email with a discount code.
 */
export async function sendPreSeasonEmail(
  customerEmail: string,
  customerName: string,
  discountCode: string
): Promise<EmailResult> {
  if (!initSendGrid()) {
    console.log("[Email] SendGrid not configured, skipping pre-season email");
    return { success: false, error: "SendGrid not configured" };
  }

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">La temporada empieza en abril</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      Hola ${customerName},<br>
      La Costa Brava te espera. La nueva temporada de alquiler de barcos comienza en abril
      y queremos que seas de los primeros en disfrutarla.
    </p>

    <div style="background-color:#eff6ff; border-radius:8px; padding:24px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 12px; color:#1e3a5f; font-size:16px; font-weight:600;">Reserva con descuento exclusivo</p>
      <p style="margin:0 0 16px; color:#475569; font-size:14px; line-height:1.5;">
        Como cliente habitual, tienes un <strong>10% de descuento</strong> en tu proxima reserva.
      </p>
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); border-radius:6px; padding:16px; display:inline-block;">
        <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:2px;">${discountCode}</span>
      </div>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="https://costabravarentaboat.app" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:6px; font-size:16px; font-weight:600;">Reservar ahora</a>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5; text-align:center;">
      No pierdas la oportunidad de vivir una experiencia unica en el Mediterraneo.
    </p>
  `;

  try {
    await sgMail.send({
      to: customerEmail,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: "La temporada empieza pronto - 10% descuento para ti",
      html: emailWrapper(content),
    });

    console.log(`[Email] Pre-season email sent to ${customerEmail}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Error sending pre-season email to ${customerEmail}:`, message);
    return { success: false, error: message };
  }
}
