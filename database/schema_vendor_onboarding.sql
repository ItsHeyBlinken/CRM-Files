-- PortalHub: vendor onboarding completion flag
-- Run in pgAdmin AFTER schema_payments_addition.sql

BEGIN;

ALTER TABLE vendor_payment_settings
    ADD COLUMN IF NOT EXISTS payment_setup_complete BOOLEAN NOT NULL DEFAULT false;

-- Grandfather existing vendors so dev/test accounts are not forced through onboarding
UPDATE vendor_payment_settings SET payment_setup_complete = true;

COMMIT;
