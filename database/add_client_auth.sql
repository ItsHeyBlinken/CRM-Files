-- =====================================================
-- Add Client Authentication to Clients Table
-- =====================================================
-- This script adds login capabilities to the clients table
-- Run this in pgAdmin after the main schema

-- Add authentication fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Create index for client authentication
CREATE INDEX IF NOT EXISTS idx_clients_email_auth ON clients(email, is_active);

-- Update existing clients to be active
UPDATE clients SET is_active = true WHERE is_active IS NULL;

-- Create function to hash client passwords
CREATE OR REPLACE FUNCTION hash_client_password(password TEXT) RETURNS TEXT AS $$
BEGIN
    -- This would use bcrypt in the application layer
    -- For now, we'll return a placeholder
    RETURN 'HASHED_' || password;
END;
$$ LANGUAGE plpgsql;

-- Display current clients with their authentication status
SELECT 
    id,
    name,
    email,
    company,
    is_active,
    last_login,
    CASE 
        WHEN password_hash IS NULL THEN 'No password set'
        ELSE 'Password set'
    END as auth_status
FROM clients
ORDER BY id;
