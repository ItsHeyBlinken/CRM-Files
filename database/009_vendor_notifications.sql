-- Migration 009 — run AFTER 008_project_payment_settings.sql
-- Vendor in-app notifications for client actions and workflow events

CREATE TABLE IF NOT EXISTS vendor_notifications (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    link_path VARCHAR(500),
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_id
    ON vendor_notifications(vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_notifications_unread
    ON vendor_notifications(vendor_id)
    WHERE read_at IS NULL;
