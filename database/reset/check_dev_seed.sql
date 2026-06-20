-- =====================================================
-- PortalHub: Check dev seed (run in pgAdmin to diagnose)
-- =====================================================

SELECT
  EXISTS (SELECT 1 FROM users WHERE email = 'vendor@test.com') AS has_vendor,
  EXISTS (SELECT 1 FROM users WHERE email = 'client@test.com') AS has_client,
  EXISTS (
    SELECT 1 FROM projects p
    INNER JOIN users u ON u.id = p.vendor_id AND u.email = 'vendor@test.com'
    WHERE p.title IN ('Miller Celebration', 'Miller Wedding')
  ) AS has_seed_project;

SELECT u.email, u.role, p.title AS project_title
FROM users u
LEFT JOIN projects p ON p.vendor_id = u.id AND u.email = 'vendor@test.com'
WHERE u.email IN ('vendor@test.com', 'client@test.com')
ORDER BY u.email;
