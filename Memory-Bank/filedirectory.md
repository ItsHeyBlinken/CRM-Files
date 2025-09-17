# File Directory: Event Planner CRM

## Project Structure Overview
```
CRM Files/
├── client/                 # React frontend application
├── server/                 # Express.js backend application
├── database/               # Database schema and scripts
├── Memory-Bank/            # Project documentation
└── DO NOT USE/             # Excluded files/directories
```

## Client Directory (`/client/`)
**Frontend React application with TypeScript and Vite**

### Configuration Files
- `package.json` - Client dependencies and scripts
- `package-lock.json` - Dependency lock file
- `tsconfig.json` - TypeScript configuration
- `tsconfig.node.json` - Node.js TypeScript config
- `vite.config.ts` - Vite build tool configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

### Source Code (`/src/`)
- `main.tsx` - React application entry point
- `App.tsx` - Main application component
- `index.html` - HTML template
- `styles/index.css` - Global CSS styles

### Component Directories
- `components/` - Reusable React components
  - `Layout/` - Layout components (header, sidebar, footer)

### Context Directories
- `contexts/` - React Context for state management

## Server Directory (`/server/`)
**Express.js backend with TypeScript and PostgreSQL**

### Configuration Files
- `package.json` - Server dependencies and scripts
- `package-lock.json` - Dependency lock file
- `tsconfig.json` - TypeScript configuration

### Source Code (`/src/`)
- `index.ts` - Main server entry point

### Configuration (`/config/`)
- `database.ts` - PostgreSQL connection configuration

### Middleware (`/middleware/`)
- `auth.ts` - Authentication middleware
- `errorHandler.ts` - Error handling middleware
- `notFound.ts` - 404 handler middleware
- `upload.ts` - File upload middleware

### Models (`/models/`)
- `Activity.ts` - Activity log model
- `Contact.ts` - Contact information model
- `Deal.ts` - Business deal model
- `Event.ts` - Event model
- `Lead.ts` - Lead/prospect model
- `Payment.ts` - Payment model
- `Task.ts` - Task model
- `User.ts` - User model
- `Vendor.ts` - Vendor model

### Services (`/services/`)
- `socketService.ts` - Socket.io real-time communication

### Utils (`/utils/`)
- `logger.ts` - Winston logging configuration

### Routes (`/routes/`) - **MISSING - NEEDS CREATION**
- `auth.ts` - Authentication routes
- `users.ts` - User management routes
- `events.ts` - Event management routes
- `vendors.ts` - Vendor management routes
- `payments.ts` - Payment routes
- `tasks.ts` - Task management routes
- `clients.ts` - Client management routes
- `upload.ts` - File upload routes
- `reports.ts` - Reporting routes

## Database Directory (`/database/`)
**PostgreSQL schema, scripts, and sample data**

### Schema Files
- `schema.sql` - Complete database schema
- `complete_schema_fix.sql` - Schema fixes and updates
- `update_schema_for_boilerplate.sql` - Boilerplate updates

### Authentication
- `add_client_auth.sql` - Client authentication setup
- `create_test_user.sql` - Test user creation
- `fix_passwords.sql` - Password fixes
- `update_passwords.sql` - Password updates
- `working_passwords.sql` - Working password configuration

### Data Management
- `sample_data.sql` - Sample data for development
- `add_event_codes.sql` - Event code additions
- `fix_constraint_error.sql` - Constraint fixes

### Utilities
- `useful_queries.sql` - Common database queries
- `README.md` - Database documentation

## Memory Bank Directory (`/Memory-Bank/`)
**Project documentation and context**

### Core Files
- `projectbrief.md` - Project overview and requirements
- `productContext.md` - Product purpose and user experience
- `activeContext.md` - Current work focus and recent changes
- `systemPatterns.md` - Architecture and design patterns
- `techContext.md` - Technologies and technical constraints
- `progress.md` - Current status and completed work
- `filedirectory.md` - This file - directory structure

## Root Directory Files
- `package.json` - Root package configuration
- `package-lock.json` - Root dependency lock
- `README.md` - Project documentation
- `READMEv1.md` - Version 1 documentation

## Excluded Directory
- `DO NOT USE/` - Files and directories to be excluded from development

## File Purposes Summary

### Frontend (Client)
- **React Components**: Reusable UI components
- **TypeScript**: Type-safe development
- **Vite**: Fast development and build tool
- **Tailwind CSS**: Utility-first styling

### Backend (Server)
- **Express Routes**: API endpoint handlers
- **Models**: Database entity definitions
- **Middleware**: Request processing pipeline
- **Services**: Business logic and real-time communication

### Database
- **Schema**: Database structure and relationships
- **Scripts**: Database setup and maintenance
- **Sample Data**: Development and testing data

### Documentation
- **Memory Bank**: Comprehensive project documentation
- **README**: Project overview and setup instructions

