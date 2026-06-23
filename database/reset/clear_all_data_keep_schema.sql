-- =====================================================
-- SmoothGig: Clear ALL application data — keep schema
-- =====================================================
-- Use when preparing a database for production go-live after
-- testing: schema stays as-is (migrations 001–013 already applied);
-- every row in application tables is removed.
--
-- This script does NOT:
--   • Run or re-run migrations 001–013
--   • DROP or ALTER tables, columns, indexes, or triggers
--   • Delete files on disk (server/uploads/ — contracts, logos, etc.)
--
-- This script DOES:
--   • Remove ALL users (including vendor@test.com / client@test.com)
--   • Remove ALL projects, quotes, invoices, contracts, notifications, etc.
--   • Reset ID sequences so new IDs start from 1
--   • Clear user_sessions if that table exists (express-session store)
--
-- BEFORE running on production:
--   1. Back up the database (pgAdmin → Backup).
--   2. Confirm migrations 001–013 are applied.
--   3. Optionally clear or replace server/uploads/ on the host.
--
-- Run in pgAdmin Query Tool on the target database.
--
-- MAINTENANCE: When migration 014+ adds application tables, add them to
-- TRUNCATE + verification below. Checklist: Memory-Bank/systemPatterns.md
-- =====================================================

BEGIN;

TRUNCATE TABLE
  quote_line_items,
  quote_contracts,
  quotes,
  vendor_notifications,
  invoices,
  contracts,
  milestones,
  project_payment_settings,
  project_invites,
  project_clients,
  projects,
  vendor_payment_settings,
  vendor_profiles,
  users
RESTART IDENTITY CASCADE;

-- express-session table (created at runtime by connect-pg-simple, not in migrations)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_sessions'
  ) THEN
    EXECUTE 'TRUNCATE TABLE user_sessions RESTART IDENTITY';
  END IF;
END $$;

COMMIT;

-- =====================================================
-- Verification — all counts should be 0
-- =====================================================
SELECT 'users' AS table_name, COUNT(*)::bigint AS row_count FROM users
UNION ALL SELECT 'vendor_profiles', COUNT(*)::bigint FROM vendor_profiles
UNION ALL SELECT 'vendor_payment_settings', COUNT(*)::bigint FROM vendor_payment_settings
UNION ALL SELECT 'projects', COUNT(*)::bigint FROM projects
UNION ALL SELECT 'project_clients', COUNT(*)::bigint FROM project_clients
UNION ALL SELECT 'project_invites', COUNT(*)::bigint FROM project_invites
UNION ALL SELECT 'project_payment_settings', COUNT(*)::bigint FROM project_payment_settings
UNION ALL SELECT 'milestones', COUNT(*)::bigint FROM milestones
UNION ALL SELECT 'contracts', COUNT(*)::bigint FROM contracts
UNION ALL SELECT 'invoices', COUNT(*)::bigint FROM invoices
UNION ALL SELECT 'quotes', COUNT(*)::bigint FROM quotes
UNION ALL SELECT 'quote_line_items', COUNT(*)::bigint FROM quote_line_items
UNION ALL SELECT 'quote_contracts', COUNT(*)::bigint FROM quote_contracts
UNION ALL SELECT 'vendor_notifications', COUNT(*)::bigint FROM vendor_notifications
ORDER BY table_name;
