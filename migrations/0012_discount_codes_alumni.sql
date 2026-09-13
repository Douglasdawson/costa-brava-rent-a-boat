-- Alumni codes from Escola Nàutica Blanes (2026-09-13): the student's personal code is
-- bound to their phone and only applies to the licensed boats. Idempotent, re-applied on
-- every boot by server/migrations/applyDiscountCodesAlumniEnsure.ts (same pattern as 0011).
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "customer_phone" text;
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "licensed_only" boolean NOT NULL DEFAULT false;
