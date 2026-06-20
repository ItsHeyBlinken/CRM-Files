-- PortalHub: payments (vendor settings + invoice payment tracking)
-- Run in pgAdmin AFTER schema_portalhub.sql (and other additive migrations).

BEGIN;

-- =====================================================
-- VENDOR PAYMENT SETTINGS (1:1 with VENDOR users)
-- =====================================================
CREATE TABLE IF NOT EXISTS vendor_payment_settings (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    stripe_account_id VARCHAR(255),
    stripe_charges_enabled BOOLEAN NOT NULL DEFAULT false,
    stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false,
    venmo_handle VARCHAR(100),
    zelle_handle VARCHAR(255),
    cashapp_handle VARCHAR(100),
    paypal_handle VARCHAR(255),
    payment_instructions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_payment_settings_vendor_id
    ON vendor_payment_settings(vendor_id);

DROP TRIGGER IF EXISTS trg_vendor_payment_settings_updated_at ON vendor_payment_settings;
CREATE TRIGGER trg_vendor_payment_settings_updated_at
    BEFORE UPDATE ON vendor_payment_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INVOICE PAYMENT FIELDS
-- =====================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30)
    CHECK (payment_method IS NULL OR payment_method IN (
        'stripe', 'venmo', 'zelle', 'cashapp', 'paypal', 'manual'
    ));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_payment_claimed_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_payment_note TEXT;

CREATE INDEX IF NOT EXISTS idx_invoices_stripe_checkout_session_id
    ON invoices(stripe_checkout_session_id)
    WHERE stripe_checkout_session_id IS NOT NULL;

COMMIT;
