import "dotenv/config";
import { z } from "zod";
import { logger } from "./lib/logger";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  ADMIN_PIN: z.string().length(6, "ADMIN_PIN must be exactly 6 digits"),
  PORT: z.coerce.number().default(5000),
  SENTRY_DSN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required for payment security").optional(),
  SENDGRID_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM_EMAIL: z.string().optional(),
  META_WHATSAPP_TOKEN: z.string().optional(),
  META_WHATSAPP_PHONE_ID: z.string().optional(),
  META_VERIFY_TOKEN: z.string().optional(),
  META_WHATSAPP_APP_SECRET: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  GCS_BUCKET_NAME: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  // Normalize the PEM at the source so every consumer gets a parseable key.
  // Hosting panels (Coolify) may store the value wrapped in quotes and/or
  // re-escape the backslashes (the container had literal \\n: backslash,
  // backslash, n); any variant breaks crypto with
  // "DECODER routines::unsupported" (gsc-sync outage 2026-07-29..08-06).
  // Base64/PEM never contains backslashes, so collapsing any backslash run
  // followed by "n" into a newline is safe.
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((raw) => {
      if (!raw) return raw;
      let key = raw.trim();
      if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1);
      }
      return key.replace(/\\+n/g, "\n");
    }),
  GOOGLE_ANALYTICS_PROPERTY_ID: z.string().optional(),
  GSC_SITE_URL: z.string().optional(),
  PAGESPEED_API_KEY: z.string().optional(),
  SHOP_SHIPPING_FLAT_CENTS: z.coerce.number().int().nonnegative().optional(),
  META_PIXEL_ID: z.string().optional(),
  META_CAPI_ACCESS_TOKEN: z.string().optional(),
  META_ADS_ACCESS_TOKEN: z.string().optional(),
  META_AD_ACCOUNT_ID: z.string().optional(),
  CRMDAMAR_DATABASE_URL: z.string().optional(),
  // HTTP bridge to the CRM (referral code lookup for the post-trip email).
  CRM_API_URL: z.string().optional(),
  CRM_API_KEY: z.string().optional(),
  BASE_URL: z.string().default("https://www.costabravarentaboat.com"),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    logger.error("Invalid environment variables", { errors: result.error.flatten().fieldErrors });
    throw new Error("Invalid environment configuration. Check the errors above.");
  }
  return result.data;
}

export const config = validateEnv();
export const isDev = config.NODE_ENV === "development";
export const isProd = config.NODE_ENV === "production";
