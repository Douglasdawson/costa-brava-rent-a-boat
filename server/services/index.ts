export { sendBookingConfirmation, sendBookingReminder, sendThankYouEmail, sendPreSeasonEmail } from "./emailService";
import { startScheduler } from "./schedulerService";

/**
 * Start all scheduled background services.
 * Call this once during server startup after routes are registered.
 */
export function startScheduledServices(): void {
  startScheduler();
}
