# System Patterns: PortalHub (placeholder)

## System Architecture

### Overall Structure
```
┌──────────────────────────────────────────────────────────┐
│                     React Client                          │
│  ┌─────────────────────┐  ┌─────────────────────────────┐ │
│  │ Vendor Dashboard    │  │ Client Portal               │ │
│  │ /dashboard/*        │  │ /portal/*                   │ │
│  └──────────┬──────────┘  └──────────────┬──────────────┘ │
└─────────────┼────────────────────────────┼────────────────┘
              │         REST + JWT         │
┌─────────────▼────────────────────────────▼────────────────┐
│                  Express Server (TypeScript)               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Auth + Roles │  │ Vendor API   │  │ Client API      │  │
│  │              │  │ (vendor_id)  │  │ (project scope) │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────────────────────┬──────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    └─────────────────┘
```

### Two-Sided Access Model

**Vendor tenancy**
- Every project, invoice, contract, deliverable belongs to one vendor (`vendor_id` or via vendor's user id)
- Vendor API routes filter by authenticated vendor — never expose another vendor's data

**Client project scope**
- Client user linked to project(s) via `project_clients`
- Client API routes require membership on the requested project
- Client sees vendor branding from `vendor_profiles` for that project

**Shared login**
- Single `/login` endpoint and page
- JWT/session payload includes `role`
- Frontend redirects: VENDOR → `/dashboard`, CLIENT → `/portal`

## Key Technical Decisions

### Database Design
- **Vendor as tenant**: Projects and related entities scoped to vendor account
- **Project as hub**: Contracts, invoices, milestones, deliverables attach to project
- **One couple per project (MVP)**: Single client user (or couple account) per project
- **Audit fields**: `created_at`, `updated_at` on all entities
- **Soft deletes**: Optional `deleted_at` for data retention

### Authentication & Authorization
- **Roles**: `VENDOR`, `CLIENT`, `ADMIN`
- **Vendor registration**: Self-serve signup
- **Client registration**: Invite token from vendor; completes signup linked to project
- **Middleware chain**:
  - `protect` — valid JWT/session
  - `requireRole('VENDOR')` — dashboard routes
  - `requireRole('CLIENT')` — portal routes
  - `requireProjectAccess` — client routes verify project_clients membership

### File Handling
- **Contracts**: PDF upload, stored path on `contracts` row
- **Deliverables**: Multer upload, client download via authenticated route
- **MVP storage**: Local filesystem or existing static serve pattern

## Design Patterns in Use

### Backend Patterns
1. **MVC + services**: Routes → services → models
2. **Authorization at route layer**: Never rely on client-side hiding alone
3. **Centralized error handling**: Consistent API error shape
4. **Invite tokens**: Signed/expiring tokens for client onboarding

### Frontend Patterns
1. **Route groups by role**: Separate layouts for dashboard vs portal
2. **AuthContext**: User, role, login/logout, post-login redirect
3. **Protected routes**: Role guard + project scope where needed
4. **Vendor branding context**: Portal reads vendor profile for theme/logo

## Core Entities (New Model)

| Entity | Purpose |
|--------|---------|
| **User** | Auth; role VENDOR or CLIENT |
| **VendorProfile** | Business name, logo, brand colors |
| **Project** | Wedding/booking; status, date, location |
| **ProjectClient** | Links client user to project |
| **Milestone** | Timeline step; `client_visible` flag |
| **Contract** | PDF file + acknowledgement fields |
| **Invoice** | Amount, due date, status (display MVP) |
| **Deliverable** | File metadata + download path |
| **Quote** *(planned)* | Pre-project proposal; line items; accept → convert to Project |

### Deprecated (Legacy CRM — Remove)
- Supplier `vendors` table (planner's vendor directory)
- Leads, Deals, Contacts as primary entities
- Event-vendor many-to-many for multi-vendor coordination
- `PLANNER` role

## API Design Patterns

### Vendor Routes (prefix `/api/vendor/`)
- `GET/POST /projects`
- `GET/PUT/DELETE /projects/:id` — GET returns full detail (linked client, contracts, milestones, invoices, deliverables)
- `POST /projects/:id/invite`
- `GET/POST /projects/:id/contracts` — PDF upload; one contract per project (MVP)
- `GET/POST /projects/:id/deliverables` — multi-file upload
- `GET/PUT /profile` (vendor branding) — *not yet built*

### Client Routes (prefix `/api/portal/`)
- `GET /project` — aggregated portal payload
- `GET /contracts/:id/file`, `POST /contracts/:id/acknowledge`
- `GET /deliverables/:id/file` — authenticated download

### Quote Routes *(planned — Phase 2)*
- `GET/POST /api/vendor/quotes`
- `POST /api/vendor/quotes/:id/send`
- `GET /api/quotes/:token` — public quote view
- `POST /api/quotes/:token/accept`
- `POST /api/vendor/quotes/:id/convert-to-project`

### Error Handling
- 401 unauthenticated, 403 wrong role or no project access, 404 not found
- Consistent JSON error body

## Real-time (Post-MVP)
- Socket.io for vendor notifications (client acknowledged contract, etc.)
- Not required for MVP loop
