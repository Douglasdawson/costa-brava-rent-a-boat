import {
  expect,
  type APIRequestContext,
  type Playwright,
} from "@playwright/test";

export const BASE_URL = "http://localhost:4000";
export const ADMIN_PIN = process.env.ADMIN_PIN || "160594";
export const AUTH_FILE = "e2e/.auth/admin.json";

// CSRF: POST endpoints require an Origin matching the host (see server middleware).
const ORIGIN = { Origin: BASE_URL };

/** Unique marker for a run so admin assertions can find exactly our record. */
export function mark(label: string) {
  const id = `${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
  return {
    id,
    firstName: `E2E-${label}-${id}`,
    phoneNumber: id.slice(-9), // 9 digits, unique per call
    email: `e2e-${label}-${id}@example.com`.toLowerCase(),
  };
}

/** Public API context (no auth) with the Origin header for CSRF. */
export async function publicApi(pw: Playwright): Promise<APIRequestContext> {
  return pw.request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: ORIGIN });
}

/** Admin API context reusing the cookie saved by global.setup.ts. */
export async function adminApi(pw: Playwright): Promise<APIRequestContext> {
  return pw.request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: ORIGIN,
    storageState: AUTH_FILE,
  });
}

/** Find a captured inquiry by the unique phone number (newest first). */
export async function findInquiryByPhone(ctx: APIRequestContext, phone: string) {
  const res = await ctx.get("/api/admin/booking-inquiries?limit=100");
  expect(res.ok(), `inquiries list ${res.status()}`).toBeTruthy();
  const { data } = await res.json();
  return (data as Array<{ phoneNumber: string }>).find(
    (d) => d.phoneNumber === phone,
  );
}

/** Find a captured booking by the unique phone number (status filter optional). */
export async function findBookingByPhone(
  ctx: APIRequestContext,
  phone: string,
  status = "requested",
) {
  const res = await ctx.get(`/api/admin/bookings?limit=100&status=${status}`);
  expect(res.ok(), `bookings list ${res.status()}`).toBeTruthy();
  const { data } = await res.json();
  return (data as Array<{ customerPhone: string }>).find((d) =>
    (d.customerPhone || "").endsWith(phone),
  );
}
