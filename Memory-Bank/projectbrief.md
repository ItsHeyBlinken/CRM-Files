# Project Brief: PortalHub (placeholder)

> **Product name:** **PortalHub** — generic placeholder; rebrand before launch.

## Project Overview
A two-sided web application for wedding freelancers and vendors (photographers, florists, DJs, etc.). Each vendor gets an admin-style dashboard to manage their business. Each vendor's clients (couples) log in to a branded portal to view only the project they hired that vendor for — status, contracts, invoices, and deliverables — all in one place instead of scattered across email, Google Drive, and separate invoicing tools.

## Product Model
- **Vendor side**: Freelancer/wedding vendor manages projects, clients, invoices, contracts, deliverables, and portal branding.
- **Client side**: One login per couple; sees only their assigned project(s) with that vendor.
- **Single app, two experiences**: Shared login page; role-based redirect after authentication.

## Core Requirements

### Vendor Dashboard
- Register and manage vendor profile and portal branding (business name, logo, colors)
- Create and manage projects (weddings/bookings)
- Invite clients (one login per couple)
- Manage project status and client-visible milestones
- Upload contracts (PDF) and track acknowledgement
- Create and display invoices (payment collection deferred post-MVP)
- Upload deliverables for client download

### Client Portal
- Accept invite and register/login (same login page as vendors)
- View assigned project only — wedding date, status, timeline
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
- Deployed and runnable in development

## Out of Scope (MVP)
- Stripe / online payments
- E-signature integrations (DocuSign, etc.)
- Multi-staff vendor accounts
- Custom subdomains per vendor
- Platform-wide analytics / reporting
