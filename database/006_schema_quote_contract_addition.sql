-- =====================================================
-- PortalHub: Quote contract attachment (additive)
-- =====================================================
-- Run in pgAdmin AFTER schema_quotes_addition.sql.
-- Optional PDF contract attached when vendor creates a quote.
-- =====================================================

BEGIN;

CREATE TABLE IF NOT EXISTS quote_contracts (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL UNIQUE REFERENCES quotes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes INTEGER,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quote_contracts_quote_id ON quote_contracts(quote_id);

COMMIT;
