export {
  sendBookingConfirmation,
  sendBookingReminder,
  sendThankYouEmail,
  sendPreSeasonEmail,
  sendPasswordResetEmail,
  sendCancelationEmail,
} from "./emailService";
import { startScheduler } from "./schedulerService";
import { initBusinessStatsCache } from "../lib/businessStatsCache";

/**
 * Start all scheduled background services.
 * Call this once during server startup after routes are registered.
 */
export function startScheduledServices(): void {
  startScheduler();
  // Warm up the GBP stats cache so SSR schemas have fresh values from request 0
  void initBusinessStatsCache();
}
