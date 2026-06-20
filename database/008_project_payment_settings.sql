-- PortalHub: project payment settings and invoice kinds
-- Migration 008 — run AFTER 007_schema_quote_contract_signing.sql.

BEGIN;

CREATE TABLE IF NOT EXISTS project_payment_settings (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    project_total DECIMAL(10, 2),
    payment_plan_type VARCHAR(30) NOT NULL DEFAULT 'pay_in_full'
        CHECK (payment_plan_type IN ('pay_in_full', 'deposit_and_balance', 'split_payments')),
    deposit_type VARCHAR(20)
        CHECK (deposit_type IS NULL OR deposit_type IN ('fixed', 'percentage')),
    deposit_value DECIMAL(10, 2),
    second_payment_due_days_before_event INTEGER,
    final_payment_due_days_before_event INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_payment_settings_project_id
    ON project_payment_settings(project_id);

DROP TRIGGER IF EXISTS trg_project_payment_settings_updated_at ON project_payment_settings;
CREATE TRIGGER trg_project_payment_settings_updated_at
    BEFORE UPDATE ON project_payment_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_kind VARCHAR(20) NOT NULL DEFAULT 'custom'
    CHECK (invoice_kind IN ('deposit', 'payment', 'final', 'custom'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_date_holding_deposit BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_kind
    ON invoices(invoice_kind);

COMMIT;
