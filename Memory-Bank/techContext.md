# Technical Context: PortalHub (placeholder)

## Technologies Used

### Frontend Stack
- **React 18**: UI library with hooks and functional components
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Socket.io Client**: Real-time communication

### Backend Stack
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **TypeScript**: Type-safe server-side development
- **PostgreSQL**: Relational database management system
- **pg-pool**: PostgreSQL connection pooling
- **JWT**: JSON Web Tokens for authentication
- **Socket.io**: Real-time bidirectional communication
- **Winston**: Logging library

### Development Tools
- **Nodemon**: Development server with auto-restart
- **ts-node**: TypeScript execution for Node.js
- **Concurrently**: Run multiple npm scripts simultaneously
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting

### Security & Middleware
- **Helmet**: Security headers and CSP
- **CORS**: Cross-Origin Resource Sharing
- **Express Rate Limit**: API rate limiting
- **Express Session**: Session management
- **Cookie Parser**: Cookie parsing middleware
- **Morgan**: HTTP request logging

### File Handling
- **Multer**: File upload middleware
- **Express Static**: Static file serving
- **Compression**: Response compression

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Development Test Accounts

Seeded via `database/seed_portalhub_dev.sql` (run after `schema_portalhub.sql`).

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **VENDOR** | `vendor@test.com` | `Password123!` | Sam Photography — has `vendor_profiles` row |
| **CLIENT** | `client@test.com` | `Password123!` | Linked to **Miller Celebration** project via `project_clients` |

**Seed project:** Miller Celebration (2026-09-12, Sam Photography vendor) — includes sample milestones, invoice `INV-001`, and an accepted invite.

**Re-seed:** Re-run `seed_portalhub_dev.sql` only on a fresh schema (will fail if emails already exist). To reset: run `schema_portalhub.sql` again, then seed.

**After login — role redirect:**
| Role | Route |
|------|-------|
| VENDOR | `/dashboard` |
| CLIENT | `/portal` |
| ADMIN | `/admin` |

**Vendor project detail:** `/dashboard/projects/:id`

### Key Application Files (PortalHub)

| Area | Paths |
|------|-------|
| Schema / seed | `database/schema_portalhub.sql`, `database/seed_portalhub_dev.sql` |
| Auth | `server/src/routes/auth.ts`, `client/src/pages/AcceptInvite.tsx` |
| Vendor API | `server/src/routes/vendorProjects.ts`, `server/src/models/Project.ts` |
| Contracts | `server/src/models/Contract.ts`, `client/src/services/contractService.ts` |
| Deliverables | `server/src/models/Deliverable.ts`, `client/src/services/deliverableService.ts` |
| Client portal | `server/src/routes/portal.ts`, `client/src/pages/ClientPortal.tsx` |
| Vendor UI | `client/src/pages/VendorDashboard.tsx`, `client/src/pages/VendorProjectDetail.tsx` |
| Uploads | `server/src/middleware/projectUpload.ts`, `server/uploads/` |

**Test client invite flow (pgAdmin):** Seed invite for `client@test.com` is already accepted. To test `/invite/:token`, create a new pending invite:

```sql
INSERT INTO project_invites (project_id, email, expires_at, created_by)
VALUES (
  (SELECT id FROM projects LIMIT 1),
  'newcouple@test.com',
  NOW() + INTERVAL '14 days',
  (SELECT id FROM users WHERE role = 'VENDOR' LIMIT 1)
);
SELECT token FROM project_invites WHERE email = 'newcouple@test.com';
```

Then open `/invite/{token}` in the app.

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/event_planner_crm
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_planner_crm
DB_USER=your_username
DB_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Authentication
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Client (when configured)
VITE_APP_NAME=PortalHub

# Stripe — client invoice payments (optional for dev; P2P works without)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
```

### Installation Commands
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd client && npm install

# Start development servers
npm run dev
```

## Technical Constraints

### Database Constraints
- **PostgreSQL Version**: Minimum v12 for JSON support
- **Connection Limits**: Configured for 20 max connections
- **Query Timeout**: 30-second timeout for long-running queries
- **Data Types**: Strict typing with proper constraints

### Performance Constraints
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **File Upload**: 10MB limit for file uploads
- **Response Compression**: Enabled for all responses
- **Connection Pooling**: Limited to 20 concurrent connections

### Security Constraints
- **HTTPS Required**: In production environment
- **CORS Configuration**: Restricted to specific origins
- **Session Security**: HttpOnly cookies with secure flag
- **Input Validation**: All inputs validated and sanitized

## Dependencies

### Production Dependencies
**Server:**
- express, cors, helmet, morgan, compression
- cookie-parser, express-session, express-rate-limit
- jsonwebtoken, bcryptjs, pg, pg-pool
- socket.io, multer, winston, dotenv

**Client:**
- react, react-dom, react-router-dom
- axios, socket.io-client
- tailwindcss, autoprefixer, postcss

### Development Dependencies
**Server:**
- @types/*, typescript, ts-node, nodemon

**Client:**
- @types/react, @types/react-dom
- @vitejs/plugin-react, vite
- typescript, eslint, prettier

## Build and Deployment

### Development Build
```bash
npm run dev          # Start both client and server
npm run server       # Start server only
npm run client       # Start client only
```

### Production Build
```bash
npm run build        # Build both client and server
npm run start        # Start production server
```

### Database Setup

**Migrations are manual.** The user runs all SQL in pgAdmin. The agent provides scripts (e.g. `database/schema_portalhub.sql`) and step-by-step instructions — never executes migrations against the database.

```bash
# PortalHub schema (pgAdmin: run database/schema_portalhub.sql)
# Optional dev seed: database/seed_portalhub_dev.sql
```

**Current tables:** `users`, `vendor_profiles`, `vendor_payment_settings`, `projects`, `project_clients`, `project_invites`, `milestones`, `contracts`, `invoices`, `deliverables`, `quotes`, `quote_line_items`

Legacy `client_event_access` removed — not used by PortalHub.

### Database Setup (legacy)
```bash
# Create database
createdb event_planner_crm

# Run schema
psql -d event_planner_crm -f database/schema.sql

# Add sample data
psql -d event_planner_crm -f database/sample_data.sql
```

