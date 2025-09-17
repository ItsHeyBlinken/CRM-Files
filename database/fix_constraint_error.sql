-- =====================================================
-- Fix Constraint Error - Step by Step
-- =====================================================
-- This script fixes the constraint error by handling it step by step
-- =====================================================

-- Step 1: Drop the problematic constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Update all existing data to uppercase
UPDATE users SET role = 'PLANNER' WHERE role = 'planner';
UPDATE users SET role = 'CLIENT' WHERE role = 'client';
UPDATE users SET role = 'ADMIN' WHERE role = 'admin';

-- Step 3: Add the new constraint with uppercase values
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('PLANNER', 'CLIENT', 'ADMIN'));

-- Step 4: Verify the data
SELECT role, COUNT(*) FROM users GROUP BY role;

-- =====================================================
-- Fix Complete
-- =====================================================
