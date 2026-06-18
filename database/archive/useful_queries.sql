-- =====================================================
-- Event Planner CRM - Useful Queries
-- =====================================================
-- Created: March 27, 2025
-- Database: planner-crm
-- 
-- This file contains useful queries for common CRM operations
-- Copy and paste individual queries as needed in pgAdmin
-- =====================================================

-- =====================================================
-- DASHBOARD QUERIES
-- =====================================================

-- 1. Get dashboard summary statistics
SELECT 
    (SELECT COUNT(*) FROM clients WHERE status = 'active') as active_clients,
    (SELECT COUNT(*) FROM events WHERE status IN ('planned', 'in_progress')) as active_events,
    (SELECT COUNT(*) FROM tasks WHERE status != 'completed') as pending_tasks,
    (SELECT COUNT(*) FROM payments WHERE status = 'completed' AND payment_date >= CURRENT_DATE - INTERVAL '30 days') as payments_this_month;

-- 2. Get upcoming events (next 30 days)
SELECT 
    e.title,
    e.event_date,
    e.start_time,
    c.name as client_name,
    e.status,
    e.budget,
    e.guest_count
FROM events e
JOIN clients c ON e.client_id = c.id
WHERE e.event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY e.event_date;

-- 3. Get overdue tasks
SELECT 
    t.title,
    t.due_date,
    t.priority,
    e.title as event_title,
    c.name as client_name,
    u.name as assigned_to
FROM tasks t
JOIN events e ON t.event_id = e.id
JOIN clients c ON e.client_id = c.id
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.due_date < CURRENT_DATE AND t.status != 'completed'
ORDER BY t.due_date;

-- =====================================================
-- CLIENT MANAGEMENT QUERIES
-- =====================================================

-- 4. Get all clients with their event count and total budget
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.company,
    c.status,
    COUNT(e.id) as event_count,
    COALESCE(SUM(e.budget), 0) as total_budget,
    c.created_at
FROM clients c
LEFT JOIN events e ON c.id = e.client_id
GROUP BY c.id, c.name, c.email, c.phone, c.company, c.status, c.created_at
ORDER BY c.name;

-- 5. Get client communication history
SELECT 
    c.name as client_name,
    e.title as event_title,
    com.communication_type,
    com.subject,
    com.message,
    com.direction,
    com.created_at,
    u.name as planner_name
FROM communications com
JOIN clients c ON com.client_id = c.id
LEFT JOIN events e ON com.event_id = e.id
LEFT JOIN users u ON com.created_by = u.id
WHERE c.id = 1  -- Replace with actual client ID
ORDER BY com.created_at DESC;

-- 6. Get client payment history
SELECT 
    c.name as client_name,
    e.title as event_title,
    p.amount,
    p.payment_date,
    p.payment_method,
    p.status,
    p.reference_number
FROM payments p
JOIN clients c ON p.client_id = c.id
JOIN events e ON p.event_id = e.id
WHERE c.id = 1  -- Replace with actual client ID
ORDER BY p.payment_date DESC;

-- =====================================================
-- EVENT MANAGEMENT QUERIES
-- =====================================================

-- 7. Get event details with client and vendor information
SELECT 
    e.id,
    e.title,
    e.description,
    e.event_date,
    e.start_time,
    e.end_time,
    e.location,
    e.status,
    e.budget,
    e.guest_count,
    c.name as client_name,
    c.email as client_email,
    c.phone as client_phone,
    u.name as planner_name,
    ARRAY_AGG(DISTINCT v.name) as vendors
FROM events e
JOIN clients c ON e.client_id = c.id
JOIN users u ON e.created_by = u.id
LEFT JOIN event_vendors ev ON e.id = ev.event_id
LEFT JOIN vendors v ON ev.vendor_id = v.id
WHERE e.id = 1  -- Replace with actual event ID
GROUP BY e.id, e.title, e.description, e.event_date, e.start_time, e.end_time, 
         e.location, e.status, e.budget, e.guest_count, c.name, c.email, c.phone, u.name;

-- 8. Get event tasks with assignments
SELECT 
    t.id,
    t.title,
    t.description,
    t.due_date,
    t.priority,
    t.status,
    u.name as assigned_to,
    e.title as event_title
FROM tasks t
JOIN events e ON t.event_id = e.id
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.event_id = 1  -- Replace with actual event ID
ORDER BY t.due_date, t.priority;

-- 9. Get event budget breakdown
SELECT 
    e.title as event_title,
    e.budget as total_budget,
    COALESCE(SUM(ev.cost), 0) as vendor_costs,
    COALESCE(SUM(p.amount), 0) as payments_received,
    (e.budget - COALESCE(SUM(ev.cost), 0)) as remaining_budget,
    (e.budget - COALESCE(SUM(p.amount), 0)) as outstanding_balance
FROM events e
LEFT JOIN event_vendors ev ON e.id = ev.event_id
LEFT JOIN payments p ON e.id = p.event_id AND p.status = 'completed'
WHERE e.id = 1  -- Replace with actual event ID
GROUP BY e.id, e.title, e.budget;

-- =====================================================
-- TASK MANAGEMENT QUERIES
-- =====================================================

-- 10. Get tasks by priority and status
SELECT 
    t.title,
    t.description,
    t.due_date,
    t.priority,
    t.status,
    e.title as event_title,
    c.name as client_name,
    u.name as assigned_to
FROM tasks t
JOIN events e ON t.event_id = e.id
JOIN clients c ON e.client_id = c.id
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.status != 'completed'
ORDER BY 
    CASE t.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    t.due_date;

-- 11. Get tasks assigned to specific user
SELECT 
    t.title,
    t.description,
    t.due_date,
    t.priority,
    t.status,
    e.title as event_title,
    c.name as client_name
FROM tasks t
JOIN events e ON t.event_id = e.id
JOIN clients c ON e.client_id = c.id
WHERE t.assigned_to = 2  -- Replace with actual user ID
ORDER BY t.due_date, t.priority;

-- =====================================================
-- VENDOR MANAGEMENT QUERIES
-- =====================================================

-- 12. Get vendors by service type with ratings
SELECT 
    v.name,
    v.service_type,
    v.contact_name,
    v.email,
    v.phone,
    v.rating,
    v.is_active,
    COUNT(ev.event_id) as events_worked,
    AVG(ev.cost) as average_cost
FROM vendors v
LEFT JOIN event_vendors ev ON v.id = ev.vendor_id
WHERE v.is_active = true
GROUP BY v.id, v.name, v.service_type, v.contact_name, v.email, v.phone, v.rating, v.is_active
ORDER BY v.service_type, v.rating DESC;

-- 13. Get vendor performance by event
SELECT 
    v.name as vendor_name,
    v.service_type,
    e.title as event_title,
    ev.cost,
    ev.service_description,
    c.name as client_name
FROM event_vendors ev
JOIN vendors v ON ev.vendor_id = v.id
JOIN events e ON ev.event_id = e.id
JOIN clients c ON e.client_id = c.id
WHERE v.id = 1  -- Replace with actual vendor ID
ORDER BY e.event_date DESC;

-- =====================================================
-- FINANCIAL QUERIES
-- =====================================================

-- 14. Get monthly revenue summary
SELECT 
    DATE_TRUNC('month', p.payment_date) as month,
    COUNT(p.id) as payment_count,
    SUM(p.amount) as total_revenue,
    AVG(p.amount) as average_payment
FROM payments p
WHERE p.status = 'completed'
GROUP BY DATE_TRUNC('month', p.payment_date)
ORDER BY month DESC;

-- 15. Get outstanding payments by client
SELECT 
    c.name as client_name,
    e.title as event_title,
    e.budget as event_budget,
    COALESCE(SUM(p.amount), 0) as payments_made,
    (e.budget - COALESCE(SUM(p.amount), 0)) as outstanding_amount
FROM events e
JOIN clients c ON e.client_id = c.id
LEFT JOIN payments p ON e.id = p.event_id AND p.status = 'completed'
WHERE e.status IN ('planned', 'in_progress')
GROUP BY e.id, e.title, e.budget, c.name
HAVING (e.budget - COALESCE(SUM(p.amount), 0)) > 0
ORDER BY outstanding_amount DESC;

-- =====================================================
-- REPORTING QUERIES
-- =====================================================

-- 16. Get event success metrics
SELECT 
    e.status,
    COUNT(*) as event_count,
    AVG(e.budget) as average_budget,
    AVG(e.guest_count) as average_guests,
    SUM(e.budget) as total_budget
FROM events e
GROUP BY e.status
ORDER BY event_count DESC;

-- 17. Get planner performance metrics
SELECT 
    u.name as planner_name,
    COUNT(DISTINCT e.id) as events_managed,
    COUNT(DISTINCT c.id) as clients_managed,
    AVG(e.budget) as average_event_budget,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
FROM users u
LEFT JOIN events e ON u.id = e.created_by
LEFT JOIN clients c ON u.id = c.created_by
LEFT JOIN tasks t ON u.id = t.assigned_to
WHERE u.role = 'planner'
GROUP BY u.id, u.name
ORDER BY events_managed DESC;

-- =====================================================
-- SEARCH AND FILTER QUERIES
-- =====================================================

-- 18. Search clients by name or company
SELECT 
    c.id,
    c.name,
    c.company,
    c.email,
    c.phone,
    c.status
FROM clients c
WHERE 
    c.name ILIKE '%smith%' OR  -- Replace with search term
    c.company ILIKE '%tech%' OR  -- Replace with search term
    c.email ILIKE '%@gmail.com'  -- Replace with search term
ORDER BY c.name;

-- 19. Search events by title or description
SELECT 
    e.id,
    e.title,
    e.description,
    e.event_date,
    c.name as client_name,
    e.status
FROM events e
JOIN clients c ON e.client_id = c.id
WHERE 
    e.title ILIKE '%wedding%' OR  -- Replace with search term
    e.description ILIKE '%conference%'  -- Replace with search term
ORDER BY e.event_date;

-- =====================================================
-- MAINTENANCE QUERIES
-- =====================================================

-- 20. Check for orphaned records
SELECT 'Events without clients' as issue, COUNT(*) as count
FROM events e
LEFT JOIN clients c ON e.client_id = c.id
WHERE c.id IS NULL
UNION ALL
SELECT 'Tasks without events', COUNT(*)
FROM tasks t
LEFT JOIN events e ON t.event_id = e.id
WHERE e.id IS NULL
UNION ALL
SELECT 'Payments without events', COUNT(*)
FROM payments p
LEFT JOIN events e ON p.event_id = e.id
WHERE e.id IS NULL;

-- 21. Get database size information
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;
