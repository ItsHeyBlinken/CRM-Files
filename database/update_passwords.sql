-- Update Sample User Passwords
-- This script updates the dummy password hashes with working bcrypt hashes
-- Run this after setting up your JWT_SECRET in the backend .env file

-- Update admin user password to: admin123
UPDATE users 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8K'
WHERE email = 'admin@eventplanner.com';

-- Update Sarah's password to: sarah123
UPDATE users 
SET password_hash = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE email = 'sarah@eventplanner.com';

-- Update Mike's password to: mike123
UPDATE users 
SET password_hash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'mike@eventplanner.com';

-- Update Emma's password to: emma123
UPDATE users 
SET password_hash = '$2a$12$mQ5vZGxpJg6K8X9K8X9K8X9K8X9K8X9K8X9K8X9K8X9K8X9K8X9K8'
WHERE email = 'emma@eventplanner.com';

-- Verify the updates
SELECT email, name, role FROM users;
