-- =====================================================
-- PortalHub: Enhanced contract acknowledgement audit trail
-- =====================================================
-- Migration 003 — run AFTER 001_schema_portalhub.sql.
-- Safe to run once; uses IF NOT EXISTS on columns.
-- =====================================================

BEGIN;

ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS acknowledgement_legal_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS acknowledgement_user_agent TEXT,
    ADD COLUMN IF NOT EXISTS acknowledgement_pdf_hash CHAR(64),
    ADD COLUMN IF NOT EXISTS acknowledgement_view_seconds INTEGER,
    ADD COLUMN IF NOT EXISTS acknowledgement_scrolled_to_end BOOLEAN,
    ADD COLUMN IF NOT EXISTS acknowledgement_consent_version VARCHAR(50);

COMMIT;
