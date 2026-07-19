-- SmoothGig: reusable quote packages (line-item templates)
-- Migration 015 — run AFTER 014_inquiries.sql

BEGIN;

CREATE TABLE IF NOT EXISTS quote_packages (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_package_line_items (
  id SERIAL PRIMARY KEY,
  package_id INTEGER NOT NULL REFERENCES quote_packages(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quote_packages_vendor_id ON quote_packages(vendor_id);
CREATE INDEX IF NOT EXISTS idx_quote_package_line_items_package_id ON quote_package_line_items(package_id);

COMMENT ON TABLE quote_packages IS
  'Vendor-defined quote packages (e.g. Wedding Collection) for one-click line items';

COMMIT;
