-- Migration 011 — run AFTER 010_drop_deliverables.sql
-- Adds vendor subscription plan column for Starter vs Pro gating (Stripe Billing hooks in later).

ALTER TABLE vendor_profiles
  ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'starter'
    CHECK (plan IN ('starter', 'pro'));

COMMENT ON COLUMN vendor_profiles.plan IS 'starter = free tier limits; pro = unlimited (set by Stripe Billing later)';
