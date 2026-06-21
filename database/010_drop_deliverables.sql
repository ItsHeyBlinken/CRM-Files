-- Migration 010 — run AFTER 009_vendor_notifications.sql
-- Removes deliverables table (feature removed from app — clients get contracts on Documents tab only).
-- Idempotent: safe if table was already dropped manually.

DROP TABLE IF EXISTS deliverables CASCADE;
