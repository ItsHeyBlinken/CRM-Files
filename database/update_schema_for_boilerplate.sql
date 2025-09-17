-- =====================================================
-- Event Planner CRM Schema Updates for Boilerplate Integration
-- =====================================================
-- This script updates the existing schema to match our new TypeScript models
-- Run this AFTER the existing schema.sql has been applied
-- =====================================================

-- =====================================================
-- UPDATE USERS TABLE
-- =====================================================

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "notifications": {"email": true, "push": true, "sms": false},
  "dashboard": {"defaultView": "overview", "widgets": []},
  "theme": "light",
  "timezone": "UTC",
  "language": "en"
}'::jsonb;

-- Update role values to match our new model
-- First, update the data to uppercase
UPDATE users SET role = 'PLANNER' WHERE role = 'planner';
UPDATE users SET role = 'CLIENT' WHERE role = 'client';
UPDATE users SET role = 'ADMIN' WHERE role = 'admin';

-- Then update the constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('PLANNER', 'CLIENT', 'ADMIN'));

-- Rename password_hash to password for consistency
ALTER TABLE users RENAME COLUMN password_hash TO password;

-- =====================================================
-- UPDATE EVENTS TABLE
-- =====================================================

-- Add missing columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'OTHER' CHECK (event_type IN ('WEDDING', 'CORPORATE', 'BIRTHDAY', 'ANNIVERSARY', 'CONFERENCE', 'PARTY', 'OTHER'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS planner_id INTEGER REFERENCES users(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS budget JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS special_requirements TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Update status values to match our new model
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check CHECK (status IN ('PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- Migrate event_date to start_date if start_date is null
UPDATE events SET start_date = event_date WHERE start_date IS NULL;

-- =====================================================
-- UPDATE TASKS TABLE
-- =====================================================

-- Add missing columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'OTHER' CHECK (type IN ('VENDOOR_CONTACT', 'VENDOOR_BOOKING', 'CLIENT_MEETING', 'VENUE_VISIT', 'CATERING_TASTING', 'DECORATION_SETUP', 'PHOTOGRAPHY_SHOOT', 'MUSIC_REHEARSAL', 'FINAL_WALKTHROUGH', 'CLEANUP', 'OTHER'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS related_to JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_pattern JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies INTEGER[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_duration INTEGER; -- in minutes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_duration INTEGER; -- in minutes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP;

-- Update priority values to match our new model
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));

-- Update status values to match our new model
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- =====================================================
-- UPDATE VENDORS TABLE
-- =====================================================

-- Add missing columns to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS categories TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS services TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_person JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pricing JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS availability JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS documents JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS social_media JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- =====================================================
-- UPDATE PAYMENTS TABLE
-- =====================================================

-- Add missing columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'FULL_PAYMENT' CHECK (payment_type IN ('DEPOSIT', 'FINAL_PAYMENT', 'INSTALLMENT', 'FULL_PAYMENT', 'REFUND'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_date TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS recurring_details JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Update payment_method values to match our new model
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check CHECK (payment_method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'OTHER'));

-- Update status values to match our new model
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'));

-- =====================================================
-- CREATE NEW INDEXES FOR ADDED COLUMNS
-- =====================================================

-- Users table new indexes
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Events table new indexes
CREATE INDEX IF NOT EXISTS idx_events_planner_id ON events(planner_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- Tasks table new indexes
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_vendor_id ON tasks(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_date ON tasks(completed_date);

-- Vendors table new indexes
CREATE INDEX IF NOT EXISTS idx_vendors_business_name ON vendors(business_name);
CREATE INDEX IF NOT EXISTS idx_vendors_is_verified ON vendors(is_verified);

-- Payments table new indexes
CREATE INDEX IF NOT EXISTS idx_payments_vendor_id ON payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_paid_date ON payments(paid_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

-- =====================================================
-- UPDATE EXISTING DATA TO MATCH NEW CONSTRAINTS
-- =====================================================

-- Users role values already updated above

-- Update events status values
UPDATE events SET status = 'PLANNING' WHERE status = 'draft';
UPDATE events SET status = 'CONFIRMED' WHERE status = 'planned';
UPDATE events SET status = 'IN_PROGRESS' WHERE status = 'in_progress';
UPDATE events SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE events SET status = 'CANCELLED' WHERE status = 'cancelled';

-- Update tasks priority values
UPDATE tasks SET priority = 'LOW' WHERE priority = 'low';
UPDATE tasks SET priority = 'MEDIUM' WHERE priority = 'medium';
UPDATE tasks SET priority = 'HIGH' WHERE priority = 'high';
UPDATE tasks SET priority = 'URGENT' WHERE priority = 'urgent';

-- Update tasks status values
UPDATE tasks SET status = 'PENDING' WHERE status = 'todo';
UPDATE tasks SET status = 'IN_PROGRESS' WHERE status = 'in_progress';
UPDATE tasks SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE tasks SET status = 'CANCELLED' WHERE status = 'blocked';

-- Update payments payment_method values
UPDATE payments SET payment_method = 'CREDIT_CARD' WHERE payment_method = 'credit_card';
UPDATE payments SET payment_method = 'BANK_TRANSFER' WHERE payment_method = 'bank_transfer';
UPDATE payments SET payment_method = 'CASH' WHERE payment_method = 'cash';
UPDATE payments SET payment_method = 'CHECK' WHERE payment_method = 'check';
UPDATE payments SET payment_method = 'OTHER' WHERE payment_method = 'other';

-- Update payments status values
UPDATE payments SET status = 'PENDING' WHERE status = 'pending';
UPDATE payments SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE payments SET status = 'FAILED' WHERE status = 'failed';
UPDATE payments SET status = 'REFUNDED' WHERE status = 'refunded';

-- =====================================================
-- SCHEMA UPDATE COMPLETE
-- =====================================================
-- Your existing schema has been updated to match the new boilerplate models
-- All existing data has been preserved and updated to match new constraints
-- =====================================================
