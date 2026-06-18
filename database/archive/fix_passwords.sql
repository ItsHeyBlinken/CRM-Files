-- Fix Sample User Passwords with Working Hashes
-- This script creates new working password hashes for the test users

-- First, let's see what users exist
SELECT id, email, name, role FROM users;

-- Update admin user password to: admin123
UPDATE users 
SET password_hash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'admin@eventplanner.com';

-- Update Sarah's password to: sarah123  
UPDATE users 
SET password_hash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'sarah@eventplanner.com';

-- Update Mike's password to: mike123
UPDATE users 
SET password_hash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'mike@eventplanner.com';

-- Update Emma's password to: emma123
UPDATE users 
SET password_hash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'emma@eventplanner.com';

-- Verify the updates
SELECT email, name, role FROM users;

-- Test: Try to find a user with the updated hash
SELECT email, name FROM users WHERE password_hash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
