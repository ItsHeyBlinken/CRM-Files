# Project Brief: PortalHub (placeholder)

> **Product name:** **TBD** — working code name **PortalHub** until launch name + `.com` are confirmed. *(Gigly considered June 2026 — rejected, domain taken.)*

## Project Overview
A two-sided web application for event freelancers and vendors (photographers, florists, DJs, planners, etc.) who **book gigs**. Each vendor gets a dashboard optimized to **streamline their business processes** — from inquiry and quoting through project delivery. Each vendor's clients get a **deliberately simple** branded portal: only what they need to see and do, with no clutter.

## End Goal
**Vendor side:** Main product focus — efficient workflows, fewer manual steps, one place to run the business.

**Client side:** Simple and easy — couples should always know status and their next step without instruction.

Asymmetric by design: depth and capability on the vendor dashboard; clarity and calm on the client portal.

## Product Model
- **Vendor side**: Freelancer/event vendor manages projects, clients, invoices, contracts, deliverables, and portal branding.
- **Client side**: One login per couple; sees only their assigned project(s) with that vendor.
- **Single app, two experiences**: Shared login page; role-based redirect after authentication.

## Core Requirements

### Vendor Dashboard
- Register and manage vendor profile and portal branding (business name, logo, colors)
- Create and manage projects (events and bookings)
- Invite clients (one login per couple)
- Manage project status and client-visible milestones
- Upload contracts (PDF) and track acknowledgement
- Create and display invoices (payment collection deferred post-MVP)
- Upload deliverables for client download

### Client Portal
- Accept invite and register/login (same login page as vendors)
- View assigned project only — event date, status, timeline
- View and acknowledge contracts (PDF + acknowledgement for MVP)
- View invoices (display only for MVP)
- Download deliverables

### Technical Requirements
- **Frontend**: React with TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js with Express.js, TypeScript
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT + sessions; roles `VENDOR`, `CLIENT`, `ADMIN`
- **Authorization**: Strict project-scoped access for clients; vendor-scoped tenancy
- **File Upload**: PDFs (contracts), documents, deliverables
- **Security**: Rate limiting, CORS, helmet, input validation

## Confirmed MVP Decisions
| Decision | Choice |
|----------|--------|
| Client accounts | One login per couple |
| Login UX | Single login page with role-based redirect |
| Payments (MVP) | Invoice display only (no Stripe yet) |
| Contracts (MVP) | PDF upload + client acknowledgement |

## Approach: First Shippable Loop
1. Vendor registers → creates project → invites client
2. Client accepts invite → registers → logs in
3. Vendor sets branding, adds milestone, uploads contract PDF, creates invoice
4. Client sees project status, acknowledges contract, views invoice, downloads deliverables

## Approach: Full Vendor Lifecycle (Planned)

**Phase 1 (MVP — largely complete):** Post-booking project hub + client portal.

**Phase 2 (Next):** Pre-booking **quoting tool** — inquiry → quote → email → client accept → create project → existing portal flow. See `productContext.md` and `activeContext.md`.

## Approach: Greenfield Product, Reuse Infrastructure
The previous Event Planner CRM direction is deprecated. Keep auth patterns, build/deploy pipeline, and stack. Replace planner-centric schema, CRM boilerplate pages, and entity models with the vendor/client portal model.

## Success Criteria (MVP)
- Vendor can create project and invite client
- Client can only access their assigned project(s)
- Role redirect works from shared login
- Contract PDF view + acknowledgement recorded
- Invoice display for client
- Vendor branding visible in client portal
- **Client portal passes the "3-second test"** — status and next action obvious without instruction
- **Client can find contract or invoice in under 30 seconds** (competitive benchmark — see `competitivePainPoints.md`)
- **Client portal usable on mobile browser without app install**
- Deployed and runnable in development

## Out of Scope (MVP)
- Stripe / online payments (vendor subscription billing also deferred — see `monetization.md`)
- E-signature integrations (DocuSign, etc.)
- Multi-staff vendor accounts
- Custom subdomains per vendor
- Platform-wide analytics / reporting
- **Quoting / proposals** — planned for Phase 2 (see productContext.md)

## Business & Monetization

**Paying customer:** Event vendor (freelancer / small business) — not the end client.

**Status:** Monetization plan **not finalized**. Before launch, complete the decision checklist in **`monetization.md`** (pricing model, tiers, trial, what features are gated).

**Working hypothesis:** Freemium or low-tier starter + **Pro ~$29–39/mo** for quoting, unlimited projects, full portal — validate with vendor interviews before implementing Stripe.

**Build order:** Product validation first (quoting + core loop) → define tiers → Stripe Billing → optional invoice payment fees later.
