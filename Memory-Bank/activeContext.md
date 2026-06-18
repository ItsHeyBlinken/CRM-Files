# Active Context: PortalHub (placeholder)

## Product Name
**PortalHub** — generic placeholder for the platform. Vendor-facing branding (logo, colors) is per-vendor inside the app; this name is only for the product itself until a final name is chosen.

## Current Work Focus
**Schema applied in pgAdmin.** Database has 9 PortalHub tables. Dev test logins documented in `techContext.md`. Next: auth updates (role redirect, client invite flow), then dashboard/portal shells.

## Database Status
- [x] `schema_portalhub.sql` applied
- [x] Legacy `client_event_access` dropped
- [ ] Confirm `seed_portalhub_dev.sql` run (test logins — see **Development Test Accounts** in `techContext.md`)

## Pivot Summary (Session Decision)
- **From**: Event Planner CRM (planner manages clients, events, supplier vendors)
- **To**: Wedding vendor client portal (vendor manages projects; couple logs into branded portal)
- **Strategy**: Start over on product/schema/UI; keep infra (React, Express, PostgreSQL, auth, deploy)

## Confirmed Product Decisions
| Decision | Choice |
|----------|--------|
| Client accounts | One login per couple |
| Login UX | Single login page with role-based redirect |
| Payments (MVP) | Invoice display only |
| Contracts (MVP) | PDF upload + client acknowledgement |

## Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Single Application                    │
├────────────────────────┬────────────────────────────────┤
│   Vendor Dashboard     │       Client Portal            │
│   /dashboard/*         │       /portal/*                │
│   Role: VENDOR         │       Role: CLIENT             │
├────────────────────────┴────────────────────────────────┤
│              Express API + PostgreSQL                    │
│   Tenancy: vendor-scoped │ Access: project-scoped       │
└─────────────────────────────────────────────────────────┘
```

## Planned Domain Model
- `users` — role: VENDOR | CLIENT | ADMIN
- `vendor_profiles` — branding, business info (1:1 with vendor user)
- `projects` — the wedding/booking the vendor was hired for
- `project_clients` — links client user to project (one couple per project for MVP)
- `milestones` — timeline items (client_visible flag)
- `contracts` — PDF path + acknowledgement timestamp
- `invoices` — amount, due date, status (display only MVP)
- `deliverables` — file uploads for client download

## What to Keep (Infrastructure)
- React + Vite + TypeScript + Tailwind client setup
- Express + PostgreSQL + JWT/session auth patterns
- Build and deployment pipeline (Nixpacks/Coolify)
- Middleware stack (CORS, helmet, rate limit, logging)

## What to Replace / Remove
- Planner-centric `database/schema.sql` entities (supplier vendors, planner events model)
- CRM boilerplate client pages: Leads, Deals, Contacts, Activities, Reports
- Legacy models: Lead, Deal, Contact, supplier Vendor
- `PLANNER` role → `VENDOR`
- Memory Bank and README event-planner framing

## Next Steps (Priority Order)
1. ~~**Design & write new schema**~~ — applied in pgAdmin ✅
2. **Run dev seed** (if not yet) — `database/seed_portalhub_dev.sql`
3. **Update auth** — VENDOR/CLIENT roles, invite-based client registration, role redirect on login
4. **Vendor dashboard shell** — layout, routes, project list/create
5. **Client portal shell** — layout, routes, project-scoped data fetch
6. **MVP features** — invite flow, milestones, contract PDF + ack, invoice display, deliverables upload
7. **Remove/archive** legacy CRM pages and unused models

## Active Technical Decisions
- Same monorepo structure (`client/`, `server/`, `database/`)
- REST API with project-scoped middleware for client routes
- File storage: local/uploads for MVP (existing multer pattern)
- No Stripe, no e-sign in MVP
- **Git commits:** user only — agent prepares changes and suggests messages; does not commit unless explicitly asked
- **Database migrations:** user applies SQL in pgAdmin — agent writes SQL files and instructions; does not run migrations

## Open Questions (Deferred)
- Email delivery provider for client invites (post-MVP or MVP?)
- Whether to archive old schema SQL files vs delete
