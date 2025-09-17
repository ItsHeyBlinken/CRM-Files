-- =====================================================
-- Complete Schema Fix - Handle All Constraint Issues
-- =====================================================
-- This script fixes all constraint issues step by step
-- =====================================================

-- =====================================================
-- STEP 1: FIX USERS TABLE CONSTRAINTS
-- =====================================================

-- Drop existing constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Update data to uppercase
UPDATE users SET role = 'PLANNER' WHERE role = 'planner';
UPDATE users SET role = 'CLIENT' WHERE role = 'client';
UPDATE users SET role = 'ADMIN' WHERE role = 'admin';

-- Add new constraint
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('PLANNER', 'CLIENT', 'ADMIN'));

-- =====================================================
-- STEP 2: FIX EVENTS TABLE CONSTRAINTS
-- =====================================================

-- Drop existing constraints
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;

-- Update data to uppercase
UPDATE events SET status = 'PLANNING' WHERE status = 'draft';
UPDATE events SET status = 'CONFIRMED' WHERE status = 'planned';
UPDATE events SET status = 'IN_PROGRESS' WHERE status = 'in_progress';
UPDATE events SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE events SET status = 'CANCELLED' WHERE status = 'cancelled';

-- Add new constraint
ALTER TABLE events ADD CONSTRAINT events_status_check CHECK (status IN ('PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- =====================================================
-- STEP 3: FIX TASKS TABLE CONSTRAINTS
-- =====================================================

-- Drop existing constraints
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Update data to uppercase
UPDATE tasks SET priority = 'LOW' WHERE priority = 'low';
UPDATE tasks SET priority = 'MEDIUM' WHERE priority = 'medium';
UPDATE tasks SET priority = 'HIGH' WHERE priority = 'high';
UPDATE tasks SET priority = 'URGENT' WHERE priority = 'urgent';

UPDATE tasks SET status = 'PENDING' WHERE status = 'todo';
UPDATE tasks SET status = 'IN_PROGRESS' WHERE status = 'in_progress';
UPDATE tasks SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE tasks SET status = 'CANCELLED' WHERE status = 'blocked';

-- Add new constraints
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- =====================================================
-- STEP 4: FIX PAYMENTS TABLE CONSTRAINTS
-- =====================================================

-- Drop existing constraints
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Update data to uppercase
UPDATE payments SET payment_method = 'CREDIT_CARD' WHERE payment_method = 'credit_card';
UPDATE payments SET payment_method = 'BANK_TRANSFER' WHERE payment_method = 'bank_transfer';
UPDATE payments SET payment_method = 'CASH' WHERE payment_method = 'cash';
UPDATE payments SET payment_method = 'CHECK' WHERE payment_method = 'check';
UPDATE payments SET payment_method = 'OTHER' WHERE payment_method = 'other';

UPDATE payments SET status = 'PENDING' WHERE status = 'pending';
UPDATE payments SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE payments SET status = 'FAILED' WHERE status = 'failed';
UPDATE payments SET status = 'REFUNDED' WHERE status = 'refunded';

-- Add new constraints
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check CHECK (payment_method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'OTHER'));
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'));

-- =====================================================
-- STEP 5: VERIFY ALL DATA
-- =====================================================

-- Check users
SELECT 'Users' as table_name, role, COUNT(*) as count FROM users GROUP BY role;

-- Check events
SELECT 'Events' as table_name, status, COUNT(*) as count FROM events GROUP BY status;

-- Check tasks
SELECT 'Tasks' as table_name, priority, COUNT(*) as count FROM tasks GROUP BY priority;
SELECT 'Tasks' as table_name, status, COUNT(*) as count FROM tasks GROUP BY status;

-- Check payments
SELECT 'Payments' as table_name, payment_method, COUNT(*) as count FROM payments GROUP BY payment_method;
SELECT 'Payments' as table_name, status, COUNT(*) as count FROM payments GROUP BY status;

-- =====================================================
-- ALL CONSTRAINTS FIXED
-- =====================================================
