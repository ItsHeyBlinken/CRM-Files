# Active Context: PortalHub (placeholder)

## Product Name
**PortalHub** — generic placeholder for the platform. Vendor-facing branding (logo, colors) is per-vendor inside the app; this name is only for the product itself until a final name is chosen.

## End Goal (Product North Star)

**Streamline vendor business processes on the dashboard; keep the client portal simple and easy to use.**

**Market entry angle:** Address documented competitor pain points — unreliable email, clunky mobile portals, hard-to-find info, payment friction, communication fragmentation. See `competitivePainPoints.md`.

This is the guiding principle for all future work — not feature parity between sides.

| Side | Focus | UX bar |
|------|--------|--------|
| **Vendor** | Primary investment — quoting, projects, clients, contracts, invoices, deliverables, workflow efficiency | Can be denser and more capable; optimize for *fewer steps* and *clear process* |
| **Client** | Constrained surface — status, next action, documents, payments, files | Must pass the **3-second test**; no CRM jargon; mobile-first; zero training |

**Implication for roadmap:** New features (e.g. quoting) are designed **vendor-first**; the client only sees what they need to act on (accept quote, sign contract, pay/view invoice, download files) — never vendor admin complexity.

## Current Work Focus
**Payments Phase 3a–3c implemented (code complete).** User must run `schema_payments_addition.sql` in pgAdmin. Stripe card pay requires server env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). P2P handles work without Stripe.

## MVP Status

| Area | Status |
|------|--------|
| Auth + role redirect | ✅ Done |
| Vendor project list + create | ✅ Done |
| Vendor project detail (`/dashboard/projects/:id`) | ✅ Done |
| Client invite flow + duplicate-client guards | ✅ Done |
| Client portal (Home / Documents / Payments / Files) | ✅ Done |
| Contract PDF upload + client acknowledgement | ✅ Done |
| Deliverable upload + client download | ✅ Done |
| Legacy CRM cleanup | ✅ Done (June 2026) |
| Quoting / proposals | ✅ Built — run SQL migration, then test |
| Vendor invoice CRUD (3a) | ✅ Built — project detail |
| Vendor payment settings (3b) | ✅ Built — `/dashboard/payments` |
| Client card pay + P2P (3c) | ✅ Built — Stripe Checkout + manual handles |
| Monetization plan | 📋 Document started — decisions in `monetization.md` |

## Next Session — Priority Order

1. **Run payments SQL** — `database/schema_payments_addition.sql` in pgAdmin
2. **Configure Stripe (optional for dev)** — Connect Express + webhook endpoint `/api/webhooks/stripe`
3. **Test flows** — vendor creates/sends invoice → client pays (card or P2P claim) → vendor marks paid
4. **Monetization plan** — Phase 3e vendor subscription billing before launch

## Quoting Workflow (Shipped — June 2026)

**Flow:**
```
Vendor creates quote → mailto / copy link → Client opens /quote/:token (no login)
    → Accept or decline → Vendor converts to project → invite → portal → contract → deliverables
```

**Pain points addressed:** email deliverability (link works even if email missed), vendor setup speed, pre-booking clarity, communication fragmentation.

**Entities:** `quotes`, `quote_line_items` — see `database/schema_quotes_addition.sql`

## Database Status
- [x] `schema_portalhub.sql` applied
- [x] Legacy `client_event_access` dropped
- [x] Dev seed applied (test logins in `techContext.md`)
- [ ] **`schema_quotes_addition.sql`** — user must run in pgAdmin
- [ ] **`schema_payments_addition.sql`** — user must run in pgAdmin

## Key Routes (current)

| Path | Role | Purpose |
|------|------|---------|
| `/dashboard` | VENDOR | Project list + create |
| `/dashboard/projects/:id` | VENDOR | Project detail (overview, invite, contract, deliverables, timeline, invoices) |
| `/dashboard/quotes` | VENDOR | Quote list + create |
| `/dashboard/quotes/:id` | VENDOR | Quote detail, client link, convert to project |
| `/dashboard/payments` | VENDOR | Stripe Connect + Venmo/Zelle/Cash App handles |
| `/portal` | CLIENT | Mobile-first client hub |
| `/invite/:token` | Public | Client account creation |
| `/quote/:token` | Public | Client quote review + accept/decline |

## Confirmed Product Decisions
| Decision | Choice |
|----------|--------|
| Client accounts | One login per couple |
| Login UX | Single login page with role-based redirect |
| Login timing | At **invite acceptance**, not at contract acknowledgement |
| Payments (MVP) | Stripe Connect card pay in portal + P2P handles (Venmo/Zelle/Cash App); vendor marks P2P paid |
| Contracts (MVP) | PDF upload + electronic signature (typed name, consent, review gate, audit trail) |
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
- **Monetization** — pricing model, tiers, free trial, Stripe Billing timeline (see `monetization.md`)
