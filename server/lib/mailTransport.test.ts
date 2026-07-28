import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import mail, { setApiKey, send } from "./mailTransport";

const realFetch = globalThis.fetch;

function mockFetch(status: number, body: unknown) {
  const spy = vi.fn(async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
  globalThis.fetch = spy as unknown as typeof fetch;
  return spy;
}

const payloadOf = (spy: ReturnType<typeof mockFetch>) =>
  JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string);

beforeEach(() => setApiKey("re_test_key"));
afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("mailTransport", () => {
  it("refuses to send with no key configured, instead of failing at the API", async () => {
    setApiKey("");
    await expect(send({ to: "a@b.com", from: "c@d.com", subject: "s", html: "<p/>" }))
      .rejects.toThrow(/not configured/i);
  });

  it("formats a named sender as 'Name <address>'", async () => {
    const spy = mockFetch(200, { id: "1" });
    await send({
      to: "buyer@example.com",
      from: { email: "pedidos@costabravarentaboat.com", name: "Costa Brava Rent a Boat" },
      subject: "Pedido",
      html: "<p>hola</p>",
    });
    expect(payloadOf(spy).from).toBe("Costa Brava Rent a Boat <pedidos@costabravarentaboat.com>");
  });

  it("strips characters that would break the From header into two recipients", async () => {
    const spy = mockFetch(200, { id: "1" });
    await send({
      to: "b@e.com",
      from: { email: "p@d.com", name: "Tienda, S.L. <spoof@evil.com>" },
      subject: "s",
      html: "<p/>",
    });
    expect(payloadOf(spy).from).toBe("Tienda S.L. spoof@evil.com <p@d.com>");
  });

  it("always sends `to` as an array and maps replyTo to Resend's snake_case", async () => {
    const spy = mockFetch(200, { id: "1" });
    await send({
      to: "buyer@example.com",
      from: "p@d.com",
      replyTo: { email: "costabravarentaboat@gmail.com", name: "Costa Brava" },
      subject: "s",
      html: "<p/>",
    });
    const p = payloadOf(spy);
    expect(p.to).toEqual(["buyer@example.com"]);
    expect(p.reply_to).toBe("Costa Brava <costabravarentaboat@gmail.com>");
  });

  it("omits reply_to and text when not provided", async () => {
    const spy = mockFetch(200, { id: "1" });
    await send({ to: "a@b.com", from: "c@d.com", subject: "s", html: "<p/>" });
    const p = payloadOf(spy);
    expect("reply_to" in p).toBe(false);
    expect("text" in p).toBe(false);
  });

  it("returns the SendGrid-shaped tuple the call sites destructure", async () => {
    mockFetch(202, { id: "abc" });
    const [response] = await send({ to: "a@b.com", from: "c@d.com", subject: "s", html: "<p/>" });
    expect(response.statusCode).toBe(202);
  });

  it("throws on a rejected send so the circuit breaker counts it as a failure", async () => {
    mockFetch(422, { message: "domain is not verified" });
    await expect(send({ to: "a@b.com", from: "c@d.com", subject: "s", html: "<p/>" }))
      .rejects.toThrow(/422.*domain is not verified/);
  });

  it("survives a non-JSON error page from an edge proxy", async () => {
    mockFetch(502, "<html>bad gateway</html>");
    await expect(send({ to: "a@b.com", from: "c@d.com", subject: "s", html: "<p/>" }))
      .rejects.toThrow(/502/);
  });

  it("exposes the same default-export shape as @sendgrid/mail", () => {
    expect(typeof mail.setApiKey).toBe("function");
    expect(typeof mail.send).toBe("function");
  });
});
