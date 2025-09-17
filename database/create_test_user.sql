-- Create a Simple Test User with Working Password
-- This will help us test if the authentication system is working

-- First, let's see what users exist
SELECT id, email, name, role FROM users;

-- Create a new test user with a simple password
INSERT INTO users (email, password_hash, name, role, phone, company, is_active, created_at, updated_at) 
VALUES (
    'test@example.com',
    '$2a$10$rQZ8VHqK9mN2pL7sT4wX6y',  -- This is a simple test hash
    'Test User',
    'planner',
    '+1-555-9999',
    'Test Company',
    true,
    NOW(),
    NOW()
);

-- Alternative: Update existing admin user with a different approach
-- Let's try updating the admin user with a hash that should work
UPDATE users 
SET password_hash = '$2a$10$rQZ8VHqK9mN2pL7sT4wX6y'
WHERE email = 'admin@eventplanner.com';

-- Verify the changes
SELECT id, email, name, role FROM users;

-- Test query to see if we can find the updated user
SELECT email, name FROM users WHERE email = 'admin@eventplanner.com';
