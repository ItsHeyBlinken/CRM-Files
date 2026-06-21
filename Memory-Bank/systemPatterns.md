# System Patterns: SmoothGig

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
- **One client per project (MVP)**: Single client user per project
- **Audit fields**: `created_at`, `updated_at` on all entities
- **Soft deletes**: Optional `deleted_at` for data retention

### Database migrations (manual, pgAdmin)
- **Numbered files** in `database/`: `001_schema_portalhub.sql` … `009_*` (next: **`010`**)
- **Format:** `NNN_short_descriptive_name.sql` — zero-padded 3-digit prefix + snake_case suffix
- **Order:** Run in numeric order; each file header states prerequisite migration(s)
- **Reset/seed:** Unnumbered scripts in `database/reset/` (data only, not schema)
- **User applies** all SQL in pgAdmin; agent writes scripts + updates `database/README.md`

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
- **Quote contracts**: PDF at `uploads/quote-contracts/{quoteId}/`; public download via quote token
- **MVP storage**: Local filesystem; **production requires persistent volume** at `/app/server/uploads`
- **PDF preview:** Quote iframes use public same-origin API URLs. **Portal contract sign iframe** uses `/api/portal/contracts/:id/file?access_token=JWT` (GET-only query auth). Avoid blob URLs in iframes — CSP `frame-src 'self'` on production. Post-sign **view PDF** uses authenticated blob fetch in a new tab.

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
4. **Vendor branding context**: Portal reads vendor profile for theme/logo; platform name uses `AppName` wordmark (**Smooth** + **Gig**)
5. **Date display**: All user-visible dates use `formatUsDate()` / `formatUsDateTime()` from `calendarHelpers.ts` (**MM-DD-YYYY**); API and DB remain **YYYY-MM-DD** date keys

## Core Entities (New Model)

| Entity | Purpose |
|--------|---------|
| **User** | Auth; role VENDOR or CLIENT |
| **VendorProfile** | Business name, logo, brand colors |
| **VendorPaymentSettings** | Stripe Connect account, P2P handles (venmo, zelle, cashapp, paypal) |
| **ProjectPaymentSettings** | Per-project payment setup: total, deposit defaults, staged payment guidance |
| **Project** | Event/booking; status, date, location |
| **ProjectClient** | Links client user to project |
| **Milestone** | Timeline step; `client_visible` flag |
| **Contract** | PDF file + acknowledgement fields |
| **Invoice** | Amount, due date, status; `invoice_kind`, date-holding deposit flag, payment_method, paid_at, Stripe session IDs, client claim fields |
| **Deliverable** | File metadata + download path |
| **Quote** | Pre-project proposal; line items; optional `quote_contracts`; accept → convert to Project |
| **QuoteContract** | PDF on quote; view-only until accepted; public e-sign via quote token |

### Deprecated (Legacy CRM — Remove)
- Supplier `vendors` table (planner's vendor directory)
- Leads, Deals, Contacts as primary entities
- Event-vendor many-to-many for multi-vendor coordination
- `PLANNER` role

## API Design Patterns

### Vendor Routes (prefix `/api/vendor/`)
- `GET/POST /projects`
- `GET/PUT /projects/:id` — GET detail; PUT updates overview (title, clientDisplayName, clientEmail, eventDate, location, description, internalNotes, status)
- `POST /projects/:id/invite`
- `GET/POST /projects/:id/contracts` — PDF upload; one contract per project (MVP)
- `GET/POST /projects/:id/deliverables` — multi-file upload
- `GET/PUT /profile` (vendor branding) — logo upload, colors, tagline (`vendorProfile.ts`)

- `GET/POST /projects/:id/invoices` — create, send, mark paid, delete
- `GET/PUT /api/vendor/payment-settings` — P2P handles + Stripe Connect status
- `POST /api/vendor/payment-settings/stripe/connect` — onboarding link

### Client Routes (prefix `/api/portal/`)
- `GET /project` — aggregated portal payload (includes `paymentOptions`)
- `GET /contracts/:id/file`, `POST /contracts/:id/acknowledge`
- `GET /deliverables/:id/file` — authenticated download
- `POST /invoices/:id/checkout` — Stripe Checkout URL
- `POST /invoices/:id/claim-sent` — client P2P payment reported

### Webhooks
- `POST /api/webhooks/stripe` — `checkout.session.completed` marks invoice paid

### Quote Routes *(built)*
- `GET/POST /api/vendor/quotes` — create with optional contract multipart upload
- `GET /api/vendor/quotes/:id` — vendor quote detail
- `GET /api/vendor/quotes/:id/contract` — vendor PDF download
- `POST /api/vendor/quotes/:id/convert-to-project`
- `GET /api/quotes/:token` — public quote view
- `POST /api/quotes/:token/accept` | `/decline`
- `GET /api/quotes/:token/contract` — public PDF
- `GET /api/quotes/:token/contract/signing-context`
- `POST /api/quotes/:token/contract/acknowledge` — public e-sign after quote accepted

### Error Handling
- 401 unauthenticated, 403 wrong role or no project access, 404 not found
- Consistent JSON error body

## Real-time
- Socket.io pushes vendor notifications (quote accepted, invite accepted, payment claimed, etc.) to bell + toasts
- Client portal uses polling on Payments tab after payment actions (no socket required for MVP)
