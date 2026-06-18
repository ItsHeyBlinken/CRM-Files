# Active Context: PortalHub (placeholder)

## Product Name
**PortalHub** — generic placeholder for the platform. Vendor-facing branding (logo, colors) is per-vendor inside the app; this name is only for the product itself until a final name is chosen.

## End Goal (Product North Star)

**Streamline vendor business processes on the dashboard; keep the client portal simple and easy to use.**

This is the guiding principle for all future work — not feature parity between sides.

| Side | Focus | UX bar |
|------|--------|--------|
| **Vendor** | Primary investment — quoting, projects, clients, contracts, invoices, deliverables, workflow efficiency | Can be denser and more capable; optimize for *fewer steps* and *clear process* |
| **Client** | Constrained surface — status, next action, documents, payments, files | Must pass the **3-second test**; no CRM jargon; mobile-first; zero training |

**Implication for roadmap:** New features (e.g. quoting) are designed **vendor-first**; the client only sees what they need to act on (accept quote, sign contract, pay/view invoice, download files) — never vendor admin complexity.

## Current Work Focus
**MVP core loop is largely complete.** Vendors manage projects from a list + detail page; clients use a mobile-first portal with contracts, invoices, and deliverables. Next session: legacy cleanup, then **quoting workflow** (pre-project sales tool).

## MVP Status (June 2026 session)

| Area | Status |
|------|--------|
| Auth + role redirect | ✅ Done |
| Vendor project list + create | ✅ Done |
| Vendor project detail (`/dashboard/projects/:id`) | ✅ Done |
| Client invite flow + duplicate-client guards | ✅ Done |
| Client portal (Home / Documents / Payments / Files) | ✅ Done |
| Contract PDF upload + client acknowledgement | ✅ Done |
| Deliverable upload + client download | ✅ Done |
| Legacy CRM cleanup | ⏳ Not started |
| Quoting / proposals | 📋 Planned (see below) |

## Next Session — Priority Order

1. **Remove/archive legacy CRM** — `/legacy/*` pages, unused routes/models (Leads, Deals, Contacts, etc.)
2. **Quoting tool (new feature)** — vendor creates quote → emails client → client accepts → vendor converts to project and continues existing portal flow
3. **Vendor polish (optional)** — create/edit invoices and milestones from project detail (currently seed-driven for Miller Wedding)
4. **Automatic invite/quote emails** — post-MVP unless needed for quoting MVP

## Planned: Quoting Workflow (User Decision — June 2026)

**Goal:** Use PortalHub as a **quoting tool for future clients**, not only post-booking project management.

**Flow:**
```
Inquiry → Vendor creates quote → Email quote to client
    → Client accepts quote → Vendor creates project in system
    → Existing flow: invite → portal → contract → invoice → deliverables
```

**Open design questions (resolve at start of next session):**
- Does inquiry capture live in-app (lead form) or vendor manually starts a quote from dashboard?
- Quote content: line items + total only, or PDF attachment, or both?
- Client acceptance: magic link (no account yet) similar to invite token, or requires email match only?
- On accept: auto-create project in `inquiry`/`booked` status, or vendor confirms conversion?
- Email: manual mailto draft (like invites today) vs integrated send (Post-MVP?)

**Likely new entities:** `quotes` (or `proposals`), line items, status (`draft` | `sent` | `accepted` | `declined` | `expired`), optional link to `projects` after conversion.

## Database Status
- [x] `schema_portalhub.sql` applied
- [x] Legacy `client_event_access` dropped
- [x] Dev seed applied (test logins in `techContext.md`)
- [ ] Quoting schema — not yet designed

## Key Routes (current)

| Path | Role | Purpose |
|------|------|---------|
| `/dashboard` | VENDOR | Project list + create |
| `/dashboard/projects/:id` | VENDOR | Project detail (overview, invite, contract, deliverables, timeline, invoices) |
| `/portal` | CLIENT | Mobile-first client hub |
| `/invite/:token` | Public | Client account creation |

## Confirmed Product Decisions
| Decision | Choice |
|----------|--------|
| Client accounts | One login per couple |
| Login UX | Single login page with role-based redirect |
| Login timing | At **invite acceptance**, not at contract acknowledgement |
| Payments (MVP) | Invoice display only |
| Contracts (MVP) | PDF upload + client acknowledgement |
| One client per project (MVP) | Enforced in API + UI |
| One contract per project (MVP) | Enforced on upload |

## Active Technical Decisions
- Monorepo: `client/`, `server/`, `database/`
- File storage: `uploads/contracts/{projectId}/`, `uploads/deliverables/{projectId}/`
- Auth-scoped file download for clients (not public static URLs)
- **Git commits:** user only
- **Database migrations:** user applies SQL in pgAdmin

## Open Questions (Deferred)
- Email delivery provider for invites and quotes
- Whether to archive vs delete old schema SQL files
- Quoting MVP scope (see design questions above)
