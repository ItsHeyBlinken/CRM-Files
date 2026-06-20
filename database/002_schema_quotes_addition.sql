-- =====================================================
-- PortalHub: Quotes (additive migration)
-- =====================================================
-- Run in pgAdmin AFTER schema_portalhub.sql is applied.
-- Safe to run once; will error if tables already exist.
-- =====================================================

BEGIN;

CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    token UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired', 'converted')),
    title VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    wedding_date DATE,
    location VARCHAR(500),
    notes TEXT,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    expires_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    responded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotes_vendor_id ON quotes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_quotes_token ON quotes(token);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quotes(project_id);

CREATE TRIGGER trg_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS quote_line_items (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_quote_id ON quote_line_items(quote_id);

COMMIT;
