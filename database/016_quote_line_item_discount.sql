-- Migration 016 — run AFTER 015_quote_packages.sql
-- Allow negative unit_price on quote line items so vendors can add discount lines at quote time.
-- Package templates keep non-negative prices; discounts live only on the quote.

ALTER TABLE quote_line_items
  DROP CONSTRAINT IF EXISTS quote_line_items_unit_price_check;

ALTER TABLE quote_line_items
  ADD CONSTRAINT quote_line_items_unit_price_check CHECK (unit_price >= -99999999.99);
