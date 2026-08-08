import { neon } from "@neondatabase/serverless";
import type Stripe from "stripe";
import { logger } from "./logger";
import { sendTelegramMessage } from "../seo/alerts/telegram";
import {
  sendCrmSenalClientConfirmation,
  sendCrmSenalOwnerNotification,
} from "../services/emailService";

// Deposit ("paga y señal") collection bridge for the operational CRM (crmdamar).
// The CRM asks this app to mint a single-use Stripe Payment Link (POST
// /api/crm/senal-link in routes/payments.ts) and sends it over WhatsApp; when
// the customer pays, the webhook routes the checkout.session here and the
// rental row is updated directly in the CRM database, same bridge pattern as
// crmDamarMerch.ts (CRMDAMAR_DATABASE_URL).
//
// Payment Links, not Checkout Sessions: a session expires after at most 24h
// and a WhatsApp customer may pay days later. `restrictions.completed_sessions`
// makes the link single-use, and it is deactivated after the payment lands.
//
// Columns written in the CRM (rentals_real): paga_senal, paga_senal_method,
// estado_reserva, senal_pagada_at. Renaming any of them there breaks this
// module silently, so both repos' CLAUDE.md carry a cross note.

export type SenalLang = "es" | "en";

export interface SenalLinkInput {
  rentalId: number;
  amountCents: number;
  boatName: string;
  dateLabel: string;
  lang: SenalLang;
  clientName: string;
  clientEmail?: string;
  previousLinkId?: string;
}

const euros = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} EUR`;

const PRODUCT_NAME: Record<SenalLang, (boat: string, date: string) => string> = {
  es: (boat, date) => `Señal de reserva - ${boat} ${date}`,
  en: (boat, date) => `Booking deposit - ${boat} ${date}`,
};

const CONFIRMATION_MESSAGE: Record<SenalLang, string> = {
  es: "Señal recibida. Tu reserva queda confirmada y en breve te llegará un email. El resto se paga el día de la salida en el puerto de Blanes.",
  en: "Deposit received. Your booking is confirmed and a confirmation email is on its way. The rest is paid on departure day at the port of Blanes.",
};

/**
 * Mint a single-use Payment Link for a rental's deposit. When the operator
 * regenerates with a new amount, the previous link is deactivated best-effort
 * so a stale WhatsApp message cannot collect the old figure.
 */
export async function createSenalPaymentLink(
  stripe: Stripe,
  input: SenalLinkInput,
): Promise<{ linkId: string; url: string }> {
  if (input.previousLinkId) {
    try {
      await stripe.paymentLinks.update(input.previousLinkId, { active: false });
    } catch (error) {
      logger.warn("[CrmSenal] Could not deactivate previous payment link", {
        previousLinkId: input.previousLinkId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const price = await stripe.prices.create({
    currency: "eur",
    unit_amount: input.amountCents,
    product_data: { name: PRODUCT_NAME[input.lang](input.boatName, input.dateLabel) },
  });

  // No payment_method_types: dynamic payment methods (dashboard decides, e.g.
  // Bizum shows up if enabled there). Metadata is copied by Stripe onto the
  // checkout sessions the link creates, which is what the webhook reads.
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    restrictions: { completed_sessions: { limit: 1 } },
    metadata: {
      type: "crm_senal",
      rentalId: String(input.rentalId),
      mode: "REAL",
      lang: input.lang,
      clientName: input.clientName,
      clientEmail: input.clientEmail ?? "",
      boatName: input.boatName,
      dateLabel: input.dateLabel,
    },
    after_completion: {
      type: "hosted_confirmation",
      hosted_confirmation: { custom_message: CONFIRMATION_MESSAGE[input.lang] },
    },
  });

  logger.info("[CrmSenal] Payment link created", {
    rentalId: input.rentalId,
    linkId: link.id,
    amountCents: input.amountCents,
  });
  return { linkId: link.id, url: link.url };
}

/**
 * Webhook side: a checkout session created from a señal payment link was paid.
 * Writes the deposit into the CRM's rentals_real with an atomic guarded UPDATE;
 * the guard (senal_pagada_at IS NULL, estado prereserva_sin_senal) is the real
 * idempotency anchor, so a redelivered event or a duplicate payment can never
 * overwrite money silently: it raises a Telegram alert instead.
 *
 * Throws only on CRM database failures, so the webhook returns 500 and Stripe
 * retries the event. Every other anomaly is alerted and swallowed, because
 * retrying cannot fix it.
 */
export async function handleCrmSenalPaid(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
): Promise<void> {
  const meta = session.metadata ?? {};
  const rentalId = Number.parseInt(meta.rentalId ?? "", 10);
  const amountCents = session.amount_total ?? 0;
  const label = `${meta.boatName ?? "?"} ${meta.dateLabel ?? ""}`.trim();

  if (!Number.isInteger(rentalId) || rentalId <= 0) {
    logger.error("[CrmSenal] Session without a valid rentalId", { sessionId: session.id });
    return;
  }
  if (meta.mode !== "REAL") {
    logger.warn("[CrmSenal] Ignoring non-REAL señal session", { sessionId: session.id, mode: meta.mode });
    return;
  }
  // Async payment methods fire checkout.session.completed while still unpaid;
  // the async_payment_succeeded event routes back here once the money exists.
  if (session.payment_status !== "paid") {
    logger.info("[CrmSenal] Session completed but not paid yet, waiting for async confirmation", {
      sessionId: session.id,
      paymentStatus: session.payment_status,
    });
    return;
  }
  if (session.currency !== "eur" || amountCents <= 0) {
    await sendTelegramMessage(
      "Señal con importe anómalo",
      `La sesión ${session.id} (reserva #${rentalId}, ${label}) llegó con ${amountCents} ${session.currency ?? "?"}. No se ha registrado nada: revisar en Stripe.`,
    );
    return;
  }

  const dbUrl = process.env.CRMDAMAR_DATABASE_URL;
  if (!dbUrl) {
    // Config regression: fail the webhook so Stripe keeps retrying while it gets fixed.
    throw new Error("CRMDAMAR_DATABASE_URL not configured, cannot record señal");
  }

  const sql = neon(dbUrl);
  const amount = amountCents / 100;
  const paidAt = new Date().toISOString();

  const updated = (await sql`
    UPDATE rentals_real
    SET paga_senal = ${amount},
        paga_senal_method = 'Stripe',
        estado_reserva = 'prereserva_con_senal',
        senal_pagada_at = ${paidAt}
    WHERE id = ${rentalId}
      AND senal_pagada_at IS NULL
      AND estado_reserva = 'prereserva_sin_senal'
    RETURNING id`) as unknown[];

  if (updated.length === 1) {
    const linkId = typeof session.payment_link === "string" ? session.payment_link : session.payment_link?.id;
    if (linkId) {
      try {
        await stripe.paymentLinks.update(linkId, { active: false });
      } catch (error) {
        logger.warn("[CrmSenal] Could not deactivate paid payment link", {
          linkId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const clientEmail = session.customer_details?.email || meta.clientEmail || "";
    const clientName = meta.clientName || "Cliente";
    const lang: SenalLang = meta.lang === "en" ? "en" : "es";

    // Notifications are best-effort: the money and the CRM row are already right.
    sendTelegramMessage(
      "Señal cobrada",
      `${clientName} ha pagado ${euros(amountCents)} de señal (${label}).\nReserva #${rentalId} marcada como prereserva con señal en el CRM.`,
    ).catch(() => {});
    sendCrmSenalOwnerNotification({
      rentalId,
      clientName,
      boatName: meta.boatName ?? "",
      dateLabel: meta.dateLabel ?? "",
      amountCents,
      clientEmail,
    }).catch((error: unknown) => {
      logger.error("[CrmSenal] Owner email failed", { rentalId, error: error instanceof Error ? error.message : String(error) });
    });
    if (clientEmail) {
      sendCrmSenalClientConfirmation({
        to: clientEmail,
        lang,
        clientName,
        boatName: meta.boatName ?? "",
        dateLabel: meta.dateLabel ?? "",
        amountCents,
      }).catch((error: unknown) => {
        logger.error("[CrmSenal] Client email failed", { rentalId, error: error instanceof Error ? error.message : String(error) });
      });
    }

    logger.info("[CrmSenal] Señal recorded in CRM", { rentalId, amountCents });
    return;
  }

  // 0 rows: the money moved but the CRM row did not. Diagnose and alert, never throw
  // (a retry cannot change the outcome) and never touch the row.
  const rows = (await sql`
    SELECT senal_pagada_at, estado_reserva FROM rentals_real WHERE id = ${rentalId}`) as Array<
    Record<string, unknown>
  >;
  const reason =
    rows.length === 0
      ? "la reserva ya no existe en el CRM"
      : rows[0].senal_pagada_at
        ? "la señal ya estaba registrada (posible pago duplicado)"
        : `la reserva está en estado "${String(rows[0].estado_reserva)}"`;

  logger.warn("[CrmSenal] Paid señal not recorded", { rentalId, sessionId: session.id, reason });
  await sendTelegramMessage(
    "Señal cobrada SIN registrar",
    `Stripe ha cobrado ${euros(amountCents)} de señal para la reserva #${rentalId} (${label}), pero ${reason}.\nRevisa el CRM y, si procede, reembolsa el pago en Stripe (sesión ${session.id}).`,
  );
}
