# Event Planner CRM Database Setup

This directory contains all the SQL files needed to set up and manage your Event Planner CRM database.

## 📁 Files Overview

### 1. `schema.sql` - Database Structure
- **Purpose**: Creates all tables, indexes, and triggers
- **When to use**: Run this FIRST to set up your database structure
- **Contains**: 
  - Users, Clients, Events, Tasks, Vendors tables
  - Payment and Communication tracking
  - Proper foreign key relationships
  - Performance indexes
  - Automatic timestamp updates

### 2. `sample_data.sql` - Sample Data
- **Purpose**: Populates your database with realistic test data
- **When to use**: Run AFTER schema.sql to have data to work with
- **Contains**:
  - 4 sample users (admin + planners)
  - 5 sample clients
  - 5 sample events
  - 8 sample tasks
  - 5 sample vendors
  - Sample payments and communications

### 3. `useful_queries.sql` - Common Operations
- **Purpose**: Ready-to-use queries for daily CRM operations
- **When to use**: Copy individual queries as needed for specific tasks
- **Contains**:
  - Dashboard statistics
  - Client management queries
  - Event planning queries
  - Financial reporting
  - Task management
  - Vendor performance

## 🚀 Setup Instructions

### Step 1: Open pgAdmin
1. Connect to your PostgreSQL server (`168.231.66.214:5432`)
2. Navigate to your `planner-crm` database
3. Right-click on the database → **Query Tool**

### Step 2: Create Database Structure
1. Open `schema.sql` in a text editor
2. Copy the entire contents
3. Paste into pgAdmin Query Tool
4. Click **Execute** (or press F5)
5. You should see success messages for each table creation

### Step 3: Add Sample Data
1. Open `sample_data.sql` in a text editor
2. Copy the entire contents
3. Paste into pgAdmin Query Tool
4. Click **Execute** (or press F5)
5. You should see INSERT success messages

### Step 4: Verify Setup
Run this query to verify everything is working:
```sql
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'Vendors', COUNT(*) FROM vendors;
```

## 📊 Database Schema Overview

```
users (planners, admins)
├── clients (event clients)
│   ├── events (planned events)
│   │   ├── tasks (event tasks)
│   │   ├── event_vendors (vendor assignments)
│   │   └── payments (client payments)
│   └── communications (client interactions)
└── vendors (service providers)
```

## 🔧 Common Operations

### Add a New Client
```sql
INSERT INTO clients (name, email, phone, company, created_by) 
VALUES ('New Client', 'client@email.com', '+1-555-0000', 'Company Name', 1);
```

### Create a New Event
```sql
INSERT INTO events (title, description, event_date, client_id, budget, created_by)
VALUES ('Event Title', 'Event Description', '2025-12-25', 1, 5000.00, 1);
```

### Assign a Task
```sql
INSERT INTO tasks (title, description, event_id, assigned_to, due_date, created_by)
VALUES ('Task Title', 'Task Description', 1, 2, '2025-12-20', 1);
```

## 📈 Useful Dashboard Queries

### Get Today's Tasks
```sql
SELECT t.title, e.title as event, c.name as client
FROM tasks t
JOIN events e ON t.event_id = e.id
JOIN clients c ON e.client_id = c.id
WHERE t.due_date = CURRENT_DATE;
```

### Get This Month's Revenue
```sql
SELECT SUM(amount) as monthly_revenue
FROM payments 
WHERE status = 'completed' 
AND payment_date >= DATE_TRUNC('month', CURRENT_DATE);
```

## 🚨 Troubleshooting

### If Tables Already Exist
- The `CREATE TABLE IF NOT EXISTS` statements will skip existing tables
- If you need to start fresh, you can drop tables first:
```sql
DROP TABLE IF EXISTS communications, payments, event_vendors, tasks, events, clients, vendors, users CASCADE;
```

### If You Get Permission Errors
- Make sure your user (`ocs-beta-db`) has CREATE permissions
- Check that you're connected to the correct database

### If Sample Data Fails
- Make sure the schema.sql ran successfully first
- Check that all tables exist before inserting data
- Verify foreign key relationships are correct

## 📞 Need Help?

If you encounter any issues:
1. Check the PostgreSQL error messages in pgAdmin
2. Verify your database connection is working
3. Ensure you have the necessary permissions
4. Check that the SQL syntax is compatible with your PostgreSQL version

## 🎯 Next Steps

Once your database is set up:
1. **Test the sample data** by running some queries
2. **Customize the data** to match your business needs
3. **Start building the frontend** - your database is ready!
4. **Use the useful_queries.sql** for daily operations

Your Event Planner CRM database is now ready to support a powerful, scalable event planning business! 🎉
