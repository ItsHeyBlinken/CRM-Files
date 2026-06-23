-- SmoothGig: vendor-hosted Stripe Payment Link (no platform Connect)
-- Migration 013 — run AFTER 012_vendor_stripe_billing.sql

BEGIN;

ALTER TABLE vendor_payment_settings
ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT;

COMMENT ON COLUMN vendor_payment_settings.stripe_payment_link IS
  'Vendor Stripe Payment Link URL; clients pay on Stripe, vendor confirms in app';

COMMIT;
