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
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().optional(),
  GOOGLE_ANALYTICS_PROPERTY_ID: z.string().optional(),
  GSC_SITE_URL: z.string().optional(),
  META_PIXEL_ID: z.string().optional(),
  META_CAPI_ACCESS_TOKEN: z.string().optional(),
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
