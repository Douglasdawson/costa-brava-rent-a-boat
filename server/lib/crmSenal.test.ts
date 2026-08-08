import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type Stripe from "stripe";

const sqlMock = vi.fn();

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => sqlMock),
}));

vi.mock("../seo/alerts/telegram", () => ({
  sendTelegramMessage: vi.fn(),
}));

vi.mock("../services/emailService", () => ({
  sendCrmSenalOwnerNotification: vi.fn(),
  sendCrmSenalClientConfirmation: vi.fn(),
  sendCrmSenalRefundNotification: vi.fn(),
}));

import { createSenalPaymentLink, handleCrmSenalPaid, deactivateSenalLink } from "./crmSenal";
import { sendTelegramMessage } from "../seo/alerts/telegram";
import {
  sendCrmSenalClientConfirmation,
  sendCrmSenalOwnerNotification,
  sendCrmSenalRefundNotification,
} from "../services/emailService";

const telegramMock = vi.mocked(sendTelegramMessage);
const ownerEmailMock = vi.mocked(sendCrmSenalOwnerNotification);
const clientEmailMock = vi.mocked(sendCrmSenalClientConfirmation);
const refundEmailMock = vi.mocked(sendCrmSenalRefundNotification);

function makeStripe() {
  return {
    prices: { create: vi.fn().mockResolvedValue({ id: "price_1" }) },
    paymentLinks: {
      create: vi.fn().mockResolvedValue({ id: "plink_new", url: "https://buy.stripe.com/x" }),
      update: vi.fn().mockResolvedValue({}),
    },
    checkout: {
      sessions: {
        list: vi.fn().mockResolvedValue({ data: [] }),
        expire: vi.fn().mockResolvedValue({}),
      },
    },
    refunds: { create: vi.fn().mockResolvedValue({ id: "re_1" }) },
  };
}

function makeSession(overrides: Record<string, unknown> = {}): Stripe.Checkout.Session {
  return {
    id: "cs_test_1",
    payment_status: "paid",
    currency: "eur",
    amount_total: 12000,
    payment_link: "plink_abc",
    payment_intent: "pi_abc",
    customer_details: { email: "cliente@test.com" },
    metadata: {
      type: "crm_senal",
      rentalId: "42",
      mode: "REAL",
      lang: "es",
      clientName: "Ana",
      clientEmail: "fallback@test.com",
      boatName: "Solar 450",
      dateLabel: "15/08/2026",
    },
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRMDAMAR_DATABASE_URL = "postgres://fake";
  // The handler chains .catch on these, so the mocks must return promises.
  telegramMock.mockResolvedValue(true);
  ownerEmailMock.mockResolvedValue({ success: true });
  clientEmailMock.mockResolvedValue({ success: true });
  refundEmailMock.mockResolvedValue({ success: true });
});

afterEach(() => {
  delete process.env.CRMDAMAR_DATABASE_URL;
});

describe("createSenalPaymentLink", () => {
  const input = {
    rentalId: 42,
    amountCents: 12000,
    boatName: "Solar 450",
    dateLabel: "15/08/2026",
    lang: "es" as const,
    clientName: "Ana",
  };

  it("creates a single-use eur payment link with crm_senal metadata", async () => {
    const stripe = makeStripe();
    const result = await createSenalPaymentLink(stripe as unknown as Stripe, input);

    expect(stripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "eur", unit_amount: 12000 }),
    );
    const linkArgs = stripe.paymentLinks.create.mock.calls[0][0];
    expect(linkArgs.restrictions).toEqual({ completed_sessions: { limit: 1 } });
    expect(linkArgs.metadata).toMatchObject({ type: "crm_senal", rentalId: "42", mode: "REAL" });
    expect(linkArgs.metadata.siblingLinkId).toBeUndefined();
    expect(linkArgs.payment_method_types).toBeUndefined();
    expect(result).toEqual({ linkId: "plink_new", url: "https://buy.stripe.com/x" });
  });

  it("deactivates AND expires open sessions of the previous link when regenerating", async () => {
    const stripe = makeStripe();
    stripe.checkout.sessions.list.mockResolvedValueOnce({ data: [{ id: "cs_open_1" }] });
    const result = await createSenalPaymentLink(stripe as unknown as Stripe, {
      ...input,
      previousLinkId: "plink_old",
    });
    expect(stripe.paymentLinks.update).toHaveBeenCalledWith("plink_old", { active: false });
    expect(stripe.checkout.sessions.expire).toHaveBeenCalledWith("cs_open_1");
    expect(result.linkId).toBe("plink_new");
  });

  it("stamps siblingLinkId on both links for a rival, without deactivating the first", async () => {
    const stripe = makeStripe();
    await createSenalPaymentLink(stripe as unknown as Stripe, {
      ...input,
      clientName: "Berta",
      siblingLinkId: "plink_A",
    });
    const linkArgs = stripe.paymentLinks.create.mock.calls[0][0];
    expect(linkArgs.metadata.siblingLinkId).toBe("plink_A");
    // The only update to plink_A is metadata stamping, never {active:false}
    expect(stripe.paymentLinks.update).toHaveBeenCalledTimes(1);
    expect(stripe.paymentLinks.update).toHaveBeenCalledWith("plink_A", { metadata: { siblingLinkId: "plink_new" } });
  });
});

describe("deactivateSenalLink", () => {
  it("deactivates the link and expires its open sessions", async () => {
    const stripe = makeStripe();
    stripe.checkout.sessions.list.mockResolvedValueOnce({ data: [{ id: "cs_a" }, { id: "cs_b" }] });
    await deactivateSenalLink(stripe as unknown as Stripe, "plink_x");
    expect(stripe.paymentLinks.update).toHaveBeenCalledWith("plink_x", { active: false });
    expect(stripe.checkout.sessions.expire).toHaveBeenCalledWith("cs_a");
    expect(stripe.checkout.sessions.expire).toHaveBeenCalledWith("cs_b");
  });

  it("never throws even if every Stripe call fails", async () => {
    const stripe = makeStripe();
    stripe.paymentLinks.update.mockRejectedValueOnce(new Error("nope"));
    stripe.checkout.sessions.list.mockRejectedValueOnce(new Error("nope"));
    await expect(deactivateSenalLink(stripe as unknown as Stripe, "plink_x")).resolves.toBeUndefined();
  });
});

describe("handleCrmSenalPaid", () => {
  it("records the señal, kills its own link and notifies on the happy path", async () => {
    const stripe = makeStripe();
    sqlMock.mockResolvedValueOnce([{ id: 42 }]);

    await handleCrmSenalPaid(makeSession(), stripe as unknown as Stripe);

    const [strings, ...values] = sqlMock.mock.calls[0];
    const query = (strings as TemplateStringsArray).join("?");
    expect(query).toContain("UPDATE rentals_real");
    expect(query).toContain("senal_pagada_at IS NULL");
    expect(query).toContain("estado_reserva = 'prereserva_sin_senal'");
    expect(values[0]).toBe(120); // amount_total 12000 -> 120 EUR
    expect(stripe.paymentLinks.update).toHaveBeenCalledWith("plink_abc", { active: false });
    expect(stripe.refunds.create).not.toHaveBeenCalled();
    expect(telegramMock).toHaveBeenCalledWith("Señal cobrada", expect.stringContaining("#42"));
    expect(ownerEmailMock).toHaveBeenCalledWith(expect.objectContaining({ rentalId: 42, amountCents: 12000 }));
    expect(clientEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: "cliente@test.com", lang: "es" }));
  });

  it("kills the rival sibling link the moment the winner pays", async () => {
    const stripe = makeStripe();
    sqlMock.mockResolvedValueOnce([{ id: 42 }]);
    const session = makeSession();
    (session.metadata as Record<string, string>).siblingLinkId = "plink_rival";

    await handleCrmSenalPaid(session, stripe as unknown as Stripe);

    expect(stripe.paymentLinks.update).toHaveBeenCalledWith("plink_abc", { active: false });
    expect(stripe.paymentLinks.update).toHaveBeenCalledWith("plink_rival", { active: false });
  });

  it("does nothing while an async payment is still unpaid", async () => {
    const stripe = makeStripe();
    await handleCrmSenalPaid(makeSession({ payment_status: "unpaid" }), stripe as unknown as Stripe);
    expect(sqlMock).not.toHaveBeenCalled();
    expect(telegramMock).not.toHaveBeenCalled();
  });

  it("ignores sessions whose mode is not REAL", async () => {
    const stripe = makeStripe();
    const session = makeSession();
    (session.metadata as Record<string, string>).mode = "DEMO";
    await handleCrmSenalPaid(session, stripe as unknown as Stripe);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it("alerts and skips on a non-eur currency without touching the CRM", async () => {
    const stripe = makeStripe();
    await handleCrmSenalPaid(makeSession({ currency: "usd" }), stripe as unknown as Stripe);
    expect(sqlMock).not.toHaveBeenCalled();
    expect(telegramMock).toHaveBeenCalledWith("Señal con importe anómalo", expect.any(String));
  });

  it("auto-refunds the loser when another Stripe payment already sealed the señal", async () => {
    const stripe = makeStripe();
    sqlMock
      .mockResolvedValueOnce([]) // guarded UPDATE matches nothing
      .mockResolvedValueOnce([{ senal_pagada_at: "2026-08-01T10:00:00Z", estado_reserva: "prereserva_con_senal" }]);

    await handleCrmSenalPaid(makeSession(), stripe as unknown as Stripe);

    expect(stripe.refunds.create).toHaveBeenCalledWith(
      { payment_intent: "pi_abc" },
      { idempotencyKey: "senal-refund-cs_test_1" },
    );
    expect(stripe.paymentLinks.update).toHaveBeenCalledWith("plink_abc", { active: false });
    expect(refundEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: "cliente@test.com" }));
    expect(telegramMock).toHaveBeenCalledWith("Señal duplicada reembolsada", expect.stringContaining("Reembolsado automáticamente"));
    expect(ownerEmailMock).not.toHaveBeenCalled();
    expect(clientEmailMock).not.toHaveBeenCalled();
  });

  it("auto-refunds when the rental no longer exists", async () => {
    const stripe = makeStripe();
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await handleCrmSenalPaid(makeSession(), stripe as unknown as Stripe);
    expect(stripe.refunds.create).toHaveBeenCalled();
    expect(telegramMock).toHaveBeenCalledWith(
      "Señal duplicada reembolsada",
      expect.stringContaining("ya no existe"),
    );
  });

  it("alerts loudly when the auto-refund itself fails", async () => {
    const stripe = makeStripe();
    stripe.refunds.create.mockRejectedValueOnce(new Error("insufficient balance"));
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await handleCrmSenalPaid(makeSession(), stripe as unknown as Stripe);
    expect(telegramMock).toHaveBeenCalledWith(
      "Señal duplicada SIN reembolsar",
      expect.stringContaining("REEMBOLSO AUTOMÁTICO FALLÓ"),
    );
    expect(refundEmailMock).not.toHaveBeenCalled();
  });

  it("NEVER auto-refunds when the estado changed without a Stripe seal (maybe recorded by hand)", async () => {
    const stripe = makeStripe();
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ senal_pagada_at: null, estado_reserva: "reserva_pagada" }]);

    await handleCrmSenalPaid(makeSession(), stripe as unknown as Stripe);

    expect(stripe.refunds.create).not.toHaveBeenCalled();
    expect(telegramMock).toHaveBeenCalledWith(
      "Señal cobrada SIN registrar",
      expect.stringContaining("No se devuelve nada automáticamente"),
    );
  });

  it("throws on CRM database errors so the webhook retries", async () => {
    const stripe = makeStripe();
    sqlMock.mockRejectedValueOnce(new Error("connection refused"));
    await expect(handleCrmSenalPaid(makeSession(), stripe as unknown as Stripe)).rejects.toThrow(
      "connection refused",
    );
  });

  it("throws when the CRM bridge is not configured", async () => {
    delete process.env.CRMDAMAR_DATABASE_URL;
    const stripe = makeStripe();
    await expect(handleCrmSenalPaid(makeSession(), stripe as unknown as Stripe)).rejects.toThrow(
      "CRMDAMAR_DATABASE_URL",
    );
  });
});
