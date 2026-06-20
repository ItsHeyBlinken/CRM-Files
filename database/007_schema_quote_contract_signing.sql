-- =====================================================
-- PortalHub: Quote contract e-sign (additive)
-- =====================================================
-- Migration 007 — run AFTER 006_schema_quote_contract_addition.sql.
-- Enables signing on the public quote link after quote acceptance.
-- =====================================================

BEGIN;

ALTER TABLE quote_contracts
    ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS acknowledgement_legal_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS acknowledgement_ip VARCHAR(45),
    ADD COLUMN IF NOT EXISTS acknowledgement_user_agent TEXT,
    ADD COLUMN IF NOT EXISTS acknowledgement_pdf_hash CHAR(64),
    ADD COLUMN IF NOT EXISTS acknowledgement_view_seconds INTEGER,
    ADD COLUMN IF NOT EXISTS acknowledgement_scrolled_to_end BOOLEAN,
    ADD COLUMN IF NOT EXISTS acknowledgement_consent_version VARCHAR(50);

COMMIT;
