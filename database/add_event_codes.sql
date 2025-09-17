-- =====================================================
-- Add Event Codes for Client Access
-- =====================================================
-- This script adds event codes to existing events table
-- Run this in pgAdmin after the main schema

-- Add event_code column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_code VARCHAR(20) UNIQUE;

-- Create function to generate unique event codes
CREATE OR REPLACE FUNCTION generate_event_code() RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate code in format: EVT-YYYY-XXXX (e.g., EVT-2025-0001)
        code := 'EVT-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(counter::TEXT, 4, '0');
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM events WHERE event_code = code) THEN
            RETURN code;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing events with generated codes
UPDATE events 
SET event_code = generate_event_code() 
WHERE event_code IS NULL;

-- Make event_code NOT NULL for future events
ALTER TABLE events ALTER COLUMN event_code SET NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_event_code ON events(event_code);

-- Add client_access table for client-event relationships
CREATE TABLE IF NOT EXISTS client_event_access (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    client_email VARCHAR(255) NOT NULL,
    access_code VARCHAR(20) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create index for client access lookups
CREATE INDEX IF NOT EXISTS idx_client_event_access_email ON client_event_access(client_email);
CREATE INDEX IF NOT EXISTS idx_client_event_access_code ON client_event_access(access_code);

-- Insert sample client access for existing events
INSERT INTO client_event_access (event_id, client_email, access_code)
SELECT 
    e.id,
    c.email,
    e.event_code
FROM events e
JOIN clients c ON e.client_id = c.id
WHERE e.event_code IS NOT NULL
ON CONFLICT DO NOTHING;

-- Display the updated events with their codes
SELECT 
    e.id,
    e.title,
    e.event_code,
    c.name as client_name,
    c.email as client_email
FROM events e
LEFT JOIN clients c ON e.client_id = c.id
ORDER BY e.id;
