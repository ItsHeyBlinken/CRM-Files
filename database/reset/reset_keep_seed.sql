-- =====================================================
-- PortalHub: Reset data — keep dev seed only
-- =====================================================
-- Preserves:
--   vendor@test.com, client@test.com
--   Sam Photography vendor profile
--   Miller Celebration (or legacy Miller Wedding) seed project
--   vendor_payment_settings for vendor@test.com (if present)
--
-- If this fails, run wipe_and_reseed_dev.sql instead.
-- =====================================================

BEGIN;

DO $$
DECLARE
  v_vendor_id INTEGER;
  v_client_id INTEGER;
  v_project_id INTEGER;
  v_missing TEXT := '';
BEGIN
  SELECT id INTO v_vendor_id FROM users WHERE email = 'vendor@test.com';
  SELECT id INTO v_client_id FROM users WHERE email = 'client@test.com';

  IF v_vendor_id IS NULL THEN
    v_missing := v_missing || 'vendor@test.com; ';
  END IF;
  IF v_client_id IS NULL THEN
    v_missing := v_missing || 'client@test.com; ';
  END IF;

  IF v_vendor_id IS NOT NULL THEN
    SELECT p.id INTO v_project_id
    FROM projects p
    WHERE p.vendor_id = v_vendor_id
      AND (
        p.title IN ('Miller Celebration', 'Miller Wedding')
        OR (
          v_client_id IS NOT NULL
          AND p.id IN (
            SELECT pc.project_id FROM project_clients pc
            WHERE pc.client_user_id = v_client_id
          )
        )
      )
    ORDER BY p.id
    LIMIT 1;
  END IF;

  IF v_project_id IS NULL THEN
    v_missing := v_missing || 'seed project (Miller Celebration); ';
  END IF;

  IF v_missing <> '' THEN
    RAISE EXCEPTION 'Seed data missing: %. Run wipe_and_reseed_dev.sql for a full reset.', v_missing;
  END IF;

  DELETE FROM quote_contracts;
  DELETE FROM quote_line_items;
  DELETE FROM quotes;

  DELETE FROM deliverables WHERE project_id IS DISTINCT FROM v_project_id;
  DELETE FROM deliverables WHERE project_id = v_project_id;

  DELETE FROM contracts WHERE project_id IS DISTINCT FROM v_project_id;
  DELETE FROM contracts WHERE project_id = v_project_id;

  DELETE FROM invoices i
  WHERE i.project_id IS DISTINCT FROM v_project_id
     OR (i.project_id = v_project_id AND i.invoice_number IS DISTINCT FROM 'INV-001');

  DELETE FROM milestones m
  WHERE m.project_id IS DISTINCT FROM v_project_id
     OR (m.project_id = v_project_id AND m.title NOT IN (
       'Contract signed', 'Engagement session', 'Event day', 'Wedding day'
     ));

  DELETE FROM project_invites pi
  WHERE pi.project_id IS DISTINCT FROM v_project_id
     OR (pi.project_id = v_project_id AND pi.email IS DISTINCT FROM 'client@test.com');

  DELETE FROM project_clients pc
  WHERE pc.project_id IS DISTINCT FROM v_project_id;

  DELETE FROM projects p
  WHERE p.id IS DISTINCT FROM v_project_id;

  DELETE FROM vendor_payment_settings vps
  WHERE vps.vendor_id IS DISTINCT FROM v_vendor_id;

  DELETE FROM vendor_profiles vp
  WHERE vp.user_id IS DISTINCT FROM v_vendor_id;

  DELETE FROM users u
  WHERE u.id NOT IN (v_vendor_id, v_client_id);
END $$;

COMMIT;
