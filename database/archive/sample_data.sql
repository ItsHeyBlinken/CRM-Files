-- =====================================================
-- Event Planner CRM Sample Data
-- =====================================================
-- Created: March 27, 2025
-- Database: planner-crm
-- 
-- Instructions: 
-- 1. First run the schema.sql file
-- 2. Then copy and paste this file into pgAdmin Query Tool
-- 3. This will populate your database with sample data
-- =====================================================

-- =====================================================
-- INSERT SAMPLE USERS
-- =====================================================
INSERT INTO users (email, password_hash, name, role, phone, company) VALUES
('admin@eventplanner.com', '$2a$10$dummy.hash.for.admin.user', 'Admin User', 'admin', '+1-555-0100', 'Event Planner Pro'),
('sarah@eventplanner.com', '$2a$10$dummy.hash.for.sarah.user', 'Sarah Johnson', 'planner', '+1-555-0101', 'Event Planner Pro'),
('mike@eventplanner.com', '$2a$10$dummy.hash.for.mike.user', 'Mike Chen', 'planner', '+1-555-0102', 'Event Planner Pro'),
('emma@eventplanner.com', '$2a$10$dummy.hash.for.emma.user', 'Emma Davis', 'planner', '+1-555-0103', 'Event Planner Pro');

-- =====================================================
-- INSERT SAMPLE CLIENTS
-- =====================================================
INSERT INTO clients (name, email, phone, company, address, notes, status, created_by) VALUES
('John & Mary Smith', 'john.smith@email.com', '+1-555-0200', 'Smith Family', '123 Main St, Anytown, USA', 'Planning 25th anniversary party', 'active', 2),
('TechCorp Inc.', 'events@techcorp.com', '+1-555-0201', 'TechCorp Inc.', '456 Business Ave, Tech City, USA', 'Annual company conference', 'active', 2),
('Sarah Williams', 'sarah.williams@email.com', '+1-555-0202', 'Williams Events', '789 Oak Rd, Event Town, USA', 'Wedding planning services', 'active', 3),
('City Hall', 'mayor@cityhall.gov', '+1-555-0203', 'City of Anytown', '321 Government Blvd, Anytown, USA', 'City festival planning', 'active', 4),
('Green Gardens', 'info@greengardens.com', '+1-555-0204', 'Green Gardens', '654 Nature Way, Garden City, USA', 'Garden party events', 'prospect', 2);

-- =====================================================
-- INSERT SAMPLE EVENTS
-- =====================================================
INSERT INTO events (title, description, event_date, start_time, end_time, location, client_id, status, budget, guest_count, created_by) VALUES
('Smith Family 25th Anniversary', 'Celebrating 25 years of marriage with family and friends', '2025-06-15', '18:00:00', '23:00:00', 'Grand Hotel Ballroom, Anytown', 1, 'planned', 5000.00, 75, 2),
('TechCorp Annual Conference 2025', 'Annual technology conference with keynote speakers and workshops', '2025-09-20', '09:00:00', '17:00:00', 'TechCorp Convention Center, Tech City', 2, 'in_progress', 25000.00, 300, 2),
('Williams Wedding Ceremony', 'Beautiful outdoor wedding ceremony and reception', '2025-08-10', '16:00:00', '23:00:00', 'Sunset Gardens, Event Town', 3, 'planned', 15000.00, 120, 3),
('Anytown Summer Festival', 'Annual city festival with food, music, and activities', '2025-07-04', '12:00:00', '22:00:00', 'Central Park, Anytown', 4, 'draft', 10000.00, 500, 4),
('Garden Party Showcase', 'Elegant garden party to showcase venue capabilities', '2025-05-20', '14:00:00', '18:00:00', 'Green Gardens Estate, Garden City', 5, 'draft', 3000.00, 50, 2);

-- =====================================================
-- INSERT SAMPLE TASKS
-- =====================================================
INSERT INTO tasks (title, description, event_id, assigned_to, due_date, priority, status, created_by) VALUES
('Book Grand Hotel Ballroom', 'Reserve the ballroom for June 15th anniversary party', 1, 2, '2025-04-01', 'high', 'completed', 2),
('Send Invitations', 'Design and send anniversary party invitations', 1, 2, '2025-04-15', 'medium', 'in_progress', 2),
('Catering Menu Selection', 'Finalize catering menu with Grand Hotel', 1, 2, '2025-05-01', 'medium', 'todo', 2),
('Book Keynote Speaker', 'Secure keynote speaker for TechCorp conference', 2, 2, '2025-06-01', 'urgent', 'todo', 2),
('Conference Registration Setup', 'Set up online registration system', 2, 3, '2025-06-15', 'high', 'in_progress', 2),
('Wedding Venue Walkthrough', 'Visit Sunset Gardens for wedding planning', 3, 3, '2025-05-15', 'medium', 'todo', 3),
('Festival Permit Application', 'Submit permit application for city festival', 4, 4, '2025-05-01', 'high', 'todo', 4),
('Garden Party Menu Planning', 'Plan menu for garden party showcase', 5, 2, '2025-04-15', 'low', 'todo', 2);

-- =====================================================
-- INSERT SAMPLE VENDORS
-- =====================================================
INSERT INTO vendors (name, service_type, contact_name, email, phone, address, notes, rating, is_active, created_by) VALUES
('Grand Hotel', 'Venue', 'Jennifer Martinez', 'events@grandhotel.com', '+1-555-0300', '100 Luxury Blvd, Anytown, USA', 'Premium hotel with excellent service', 5, true, 2),
('Elite Catering', 'Catering', 'Robert Wilson', 'robert@elitecatering.com', '+1-555-0301', '200 Food Street, Anytown, USA', 'High-end catering for special events', 5, true, 2),
('Perfect Flowers', 'Florist', 'Lisa Anderson', 'lisa@perfectflowers.com', '+1-555-0302', '300 Bloom Ave, Anytown, USA', 'Beautiful floral arrangements', 4, true, 3),
('Sound & Light Pro', 'Audio/Visual', 'David Thompson', 'david@soundlightpro.com', '+1-555-0303', '400 Tech Drive, Tech City, USA', 'Professional A/V equipment and service', 4, true, 2),
('Transport Express', 'Transportation', 'Maria Garcia', 'maria@transportexpress.com', '+1-555-0304', '500 Transport Way, Anytown, USA', 'Luxury transportation services', 4, true, 4);

-- =====================================================
-- INSERT SAMPLE EVENT-VENDOR RELATIONSHIPS
-- =====================================================
INSERT INTO event_vendors (event_id, vendor_id, service_description, cost, notes) VALUES
(1, 1, 'Ballroom rental for anniversary party', 1500.00, 'Includes setup and cleanup'),
(1, 2, 'Catering for 75 guests', 2500.00, 'Three-course meal with dessert'),
(1, 3, 'Floral centerpieces and decorations', 800.00, 'Elegant white and gold theme'),
(2, 4, 'A/V equipment for conference', 5000.00, 'Includes microphones, projectors, and sound system'),
(3, 3, 'Wedding flowers and decorations', 2000.00, 'Romantic garden theme'),
(3, 5, 'Guest transportation', 1200.00, 'Shuttle service from hotels to venue');

-- =====================================================
-- INSERT SAMPLE PAYMENTS
-- =====================================================
INSERT INTO payments (event_id, client_id, amount, payment_date, payment_method, status, reference_number, notes, created_by) VALUES
(1, 1, 1500.00, '2025-03-15', 'credit_card', 'completed', 'PAY-001', 'Venue deposit payment', 2),
(1, 1, 2500.00, '2025-04-01', 'bank_transfer', 'completed', 'PAY-002', 'Catering payment', 2),
(2, 2, 10000.00, '2025-03-01', 'credit_card', 'completed', 'PAY-003', 'Conference venue deposit', 2),
(2, 2, 5000.00, '2025-03-15', 'bank_transfer', 'completed', 'PAY-004', 'A/V equipment payment', 2),
(3, 3, 5000.00, '2025-03-20', 'check', 'completed', 'PAY-005', 'Wedding venue deposit', 3);

-- =====================================================
-- INSERT SAMPLE COMMUNICATIONS
-- =====================================================
INSERT INTO communications (client_id, event_id, communication_type, subject, message, direction, created_by) VALUES
(1, 1, 'email', 'Anniversary Party Planning', 'Hi John and Mary, I wanted to follow up on our anniversary party planning. We have the venue booked and are working on the catering menu. When would be a good time to discuss the details?', 'outbound', 2),
(1, 1, 'email', 'Re: Anniversary Party Planning', 'Hi Sarah, thanks for the update! We are so excited. We can meet this Friday at 2 PM if that works for you.', 'inbound', 2),
(2, 2, 'phone', 'Conference Planning Update', 'Discussed keynote speaker options and registration system setup. Client wants to proceed with online registration.', 'outbound', 2),
(3, 3, 'meeting', 'Wedding Venue Walkthrough', 'Scheduled venue walkthrough for May 15th at 2 PM. Will discuss layout, catering options, and decoration possibilities.', 'outbound', 3),
(4, 4, 'email', 'Festival Permit Application', 'Hi Mayor, I have submitted the permit application for the summer festival. I will follow up with the city planning department next week.', 'outbound', 4);

-- =====================================================
-- SAMPLE DATA INSERTION COMPLETE
-- =====================================================
-- Your database now contains realistic sample data for testing
-- You can now test all the CRM features with this data
-- =====================================================

-- =====================================================
-- VERIFICATION QUERIES (Optional - run these to verify data)
-- =====================================================

-- Check total counts
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments
UNION ALL
SELECT 'Communications', COUNT(*) FROM communications;

-- Check upcoming events
SELECT 
    e.title,
    e.event_date,
    c.name as client_name,
    e.status,
    e.budget
FROM events e
JOIN clients c ON e.client_id = c.id
WHERE e.event_date >= CURRENT_DATE
ORDER BY e.event_date;

-- Check pending tasks
SELECT 
    t.title,
    t.due_date,
    t.priority,
    t.status,
    e.title as event_title
FROM tasks t
JOIN events e ON t.event_id = e.id
WHERE t.status != 'completed'
ORDER BY t.due_date;
