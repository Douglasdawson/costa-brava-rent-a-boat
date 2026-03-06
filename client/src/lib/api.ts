const BASE = "/api";
const ADMIN = `${BASE}/admin`;

export const API = {
  boats: `${BASE}/boats`,
  bookings: `${BASE}/bookings`,
  testimonials: `${BASE}/testimonials`,
  newsletter: `${BASE}/newsletter/subscribe`,
  inquiries: `${BASE}/booking-inquiries`,
  gallery: `${BASE}/gallery`,
  admin: {
    bookings: `${ADMIN}/bookings`,
    customers: `${ADMIN}/customers`,
    boats: `${ADMIN}/boats`,
    boatReorder: `${ADMIN}/boat-reorder`,
    stats: {
      dashboard: `${ADMIN}/stats/dashboard`,
      revenue: `${ADMIN}/stats/revenue-trend`,
      boats: `${ADMIN}/stats/boats-performance`,
      status: `${ADMIN}/stats/status-distribution`,
      fleet: `${ADMIN}/stats/fleet-availability`,
    },
    gallery: `${ADMIN}/gallery`,
    inquiries: `${ADMIN}/booking-inquiries`,
    inventory: `${ADMIN}/inventory`,
    maintenance: `${ADMIN}/maintenance`,
    documents: `${ADMIN}/documents`,
    discounts: `${ADMIN}/discounts`,
    giftcards: `${ADMIN}/giftcards`,
    employees: `${ADMIN}/employees`,
    checkins: `${ADMIN}/checkins`,
    config: `${ADMIN}/config`,
  },
} as const;

/**
 * Fetch wrapper for admin API calls with auth token.
 */
export function adminFetch(url: string, token: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}
