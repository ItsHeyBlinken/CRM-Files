-- Migration 012 — run AFTER 011_vendor_plan.sql
-- Stripe Billing fields for vendor Pro subscriptions.

ALTER TABLE vendor_profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_stripe_customer
  ON vendor_profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_stripe_subscription
  ON vendor_profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN vendor_profiles.stripe_customer_id IS 'Stripe Customer for SmoothGig vendor subscription billing';
COMMENT ON COLUMN vendor_profiles.stripe_subscription_id IS 'Active Stripe Subscription id when on Pro';
COMMENT ON COLUMN vendor_profiles.subscription_status IS 'Mirrors Stripe subscription.status';
COMMENT ON COLUMN vendor_profiles.stripe_price_id IS 'Price id locked at subscribe time (founding vs standard later)';
