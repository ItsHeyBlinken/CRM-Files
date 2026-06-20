-- =====================================================
-- PortalHub: Wipe all app data + restore dev seed
-- =====================================================
-- Use when reset_keep_seed.sql fails ("Seed data missing") or you want
-- a completely clean slate with ONLY vendor@test.com + client@test.com.
--
-- WARNING: Deletes ALL users, projects, quotes, etc. (not user_sessions).
-- Password for both accounts: Password123!
-- =====================================================

BEGIN;

-- Child tables first
DELETE FROM quote_contracts;
DELETE FROM quote_line_items;
DELETE FROM quotes;
DELETE FROM deliverables;
DELETE FROM invoices;
DELETE FROM contracts;
DELETE FROM milestones;
DELETE FROM project_invites;
DELETE FROM project_clients;
DELETE FROM projects;
DELETE FROM vendor_payment_settings;
DELETE FROM vendor_profiles;
DELETE FROM users;

-- =====================================================
-- Dev seed (same as seed_portalhub_dev.sql)
-- =====================================================

INSERT INTO users (
    email, password, first_name, last_name, role, phone, company, is_active, email_verified
) VALUES (
    'vendor@test.com',
    '$2a$12$tRLk6vwvx37joAQD5oQroe2NctVoGtLCtE4lzrzjhJjUaWWyZ7v4i',
    'Sam',
    'Photographer',
    'VENDOR',
    '555-0100',
    'Sam Photography',
    true,
    true
);

INSERT INTO users (
    email, password, first_name, last_name, role, is_active, email_verified
) VALUES (
    'client@test.com',
    '$2a$12$tRLk6vwvx37joAQD5oQroe2NctVoGtLCtE4lzrzjhJjUaWWyZ7v4i',
    'Alex',
    'Miller',
    'CLIENT',
    true,
    true
);

INSERT INTO vendor_profiles (
    user_id, business_name, service_type, tagline, primary_color, secondary_color
) VALUES (
    (SELECT id FROM users WHERE email = 'vendor@test.com'),
    'Sam Photography',
    'photographer',
    'Capturing your day, beautifully.',
    '#7c3aed',
    '#5b21b6'
);

INSERT INTO projects (
    vendor_id, title, description, wedding_date, location, status,
    couple_display_name, client_email
) VALUES (
    (SELECT id FROM users WHERE email = 'vendor@test.com'),
    'Miller Celebration',
    'Full-day event photography coverage.',
    '2026-09-12',
    'The Garden Estate, Austin TX',
    'booked',
    'Alex & Jordan Miller',
    'client@test.com'
);

INSERT INTO project_clients (
    project_id, client_user_id, couple_display_name
) VALUES (
    (SELECT id FROM projects WHERE title = 'Miller Celebration' LIMIT 1),
    (SELECT id FROM users WHERE email = 'client@test.com'),
    'Alex & Jordan Miller'
);

INSERT INTO milestones (project_id, title, description, due_date, status, client_visible, sort_order)
VALUES
    ((SELECT id FROM projects WHERE title = 'Miller Celebration' LIMIT 1),
     'Contract signed', 'Client reviews and acknowledges contract.', CURRENT_DATE - 30, 'complete', true, 1),
    ((SELECT id FROM projects WHERE title = 'Miller Celebration' LIMIT 1),
     'Engagement session', 'Mini session before the main event.', CURRENT_DATE + 14, 'pending', true, 2),
    ((SELECT id FROM projects WHERE title = 'Miller Celebration' LIMIT 1),
     'Event day', 'Full coverage on event date.', '2026-09-12', 'pending', true, 3);

INSERT INTO invoices (
    project_id, invoice_number, title, description, amount, due_date, status, created_by
) VALUES (
    (SELECT id FROM projects WHERE title = 'Miller Celebration' LIMIT 1),
    'INV-001',
    'Retainer',
    '50% retainer due at booking.',
    2500.00,
    CURRENT_DATE + 7,
    'sent',
    (SELECT id FROM users WHERE email = 'vendor@test.com')
);

INSERT INTO project_invites (
    project_id, email, expires_at, accepted_at, created_by
) VALUES (
    (SELECT id FROM projects WHERE title = 'Miller Celebration' LIMIT 1),
    'client@test.com',
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    CURRENT_TIMESTAMP,
    (SELECT id FROM users WHERE email = 'vendor@test.com')
);

-- Grandfather vendor through onboarding gate (same as 005_schema_vendor_onboarding.sql)
INSERT INTO vendor_payment_settings (vendor_id, payment_setup_complete)
VALUES ((SELECT id FROM users WHERE email = 'vendor@test.com'), true)
ON CONFLICT (vendor_id) DO UPDATE SET payment_setup_complete = true;

COMMIT;
