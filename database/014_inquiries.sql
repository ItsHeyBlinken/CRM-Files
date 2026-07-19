-- SmoothGig: vendor inquiries (Lead Inbox — UI label "Inquiries")
-- Migration 014 — run AFTER 013_vendor_stripe_payment_link.sql

BEGIN;

CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  service_type VARCHAR(255),
  event_date DATE,
  budget NUMERIC(12, 2),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'quote_sent', 'booked', 'lost')),
  quote_id INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_vendor_id ON inquiries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_vendor_status ON inquiries(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_inquiries_quote_id ON inquiries(quote_id);

COMMENT ON TABLE inquiries IS
  'Pre-booking inquiries captured by vendors; feeds into quotes (Client Flow left side)';

COMMIT;
