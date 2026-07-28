/**
 * Drop-in replacement for `@sendgrid/mail`, backed by Resend.
 *
 * Why a shim instead of rewriting the call sites: this codebase sends from 17
 * places across three files, all using the same tiny slice of the SendGrid API
 * (`setApiKey` plus `send({to, from, replyTo, subject, html})`). Matching that
 * shape means the migration is an import swap, and the email templates, the
 * circuit breaker and the `[response.statusCode]` destructuring keep working
 * untouched.
 *
 * Why Resend at all: the SendGrid account is a trial whose daily allowance has
 * been 0 since 2026-06-01, so it answers `401 Maximum credits exceeded` to every
 * send. See the `sendgrid-account-dead` note.
 *
 * Deliberately NOT implemented: attachments, templates, cc/bcc, scheduled
 * sends, categories. Nothing in this project uses them; add them the day
 * something does.
 */

import { logger } from "./logger";

export interface MailAddress {
  email: string;
  name?: string;
}

export interface MailMessage {
  to: string | string[];
  from: string | MailAddress;
  replyTo?: string | MailAddress;
  subject: string;
  html: string;
  text?: string;
}

/** Minimal shape of the SendGrid response the callers destructure. */
export interface MailResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

let apiKey = "";

/** `"Name <mail@dom.com>"` when there is a name, bare address otherwise. */
function formatAddress(value: string | MailAddress): string {
  if (typeof value === "string") return value;
  // A comma inside the display name would split the header into two recipients.
  const name = value.name?.replace(/[,<>]/g, "").trim();
  return name ? `${name} <${value.email}>` : value.email;
}

export function setApiKey(key: string): void {
  apiKey = key || "";
}

export async function send(message: MailMessage): Promise<[MailResponse, unknown]> {
  if (!apiKey) throw new Error("Mail transport not configured: missing API key");

  const payload: Record<string, unknown> = {
    from: formatAddress(message.from),
    to: Array.isArray(message.to) ? message.to : [message.to],
    subject: message.subject,
    html: message.html,
  };
  if (message.text) payload.text = message.text;
  if (message.replyTo) payload.reply_to = formatAddress(message.replyTo);

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let body: unknown = raw;
  try {
    body = JSON.parse(raw);
  } catch {
    // Resend answers JSON; a non-JSON body means an edge/proxy error page.
  }

  if (!res.ok) {
    // Throw like the SendGrid client did, so the existing try/catch and the
    // circuit breaker treat a rejected send as a failure instead of a success.
    logger.error("[Mail] Send rejected", { status: res.status, body });
    const error = new Error(
      `Mail send failed (${res.status}): ${typeof body === "object" && body && "message" in body ? String((body as { message: unknown }).message) : raw.slice(0, 200)}`,
    );
    throw error;
  }

  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    headers[k] = v;
  });
  return [{ statusCode: res.status, body, headers }, body];
}

export default { setApiKey, send };
