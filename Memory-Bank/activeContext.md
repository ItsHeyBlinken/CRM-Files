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

**Implication for roadmap:** New features are designed **vendor-first**; the client only sees what they need to act on (accept quote, sign contract, pay invoice, download files) — never vendor admin complexity.

## Current Work Focus

**Payments Phase 3a–3c shipped and tested in dev.** User applied `schema_payments_addition.sql` (`vendor_payment_settings` confirmed in DB).

**Next major product push:** **Vendor onboarding flow** — vendor is the paying customer; signup/onboarding must include **how they get paid** (P2P handles and/or Stripe Connect), without sacrificing client portal simplicity.

## MVP Status

| Area | Status |
|------|--------|
| Auth + role redirect | ✅ Done |
| Vendor project list + create | ✅ Done |
| Vendor project detail (`/dashboard/projects/:id`) | ✅ Done |
| Client invite flow + duplicate-client guards | ✅ Done |
| Client portal (Home / Documents / Payments / Files) | ✅ Done |
| Contract PDF upload + enhanced e-sign audit trail | ✅ Done |
| Deliverable upload + client download | ✅ Done |
| Legacy CRM cleanup | ✅ Done (June 2026) |
| Quoting / proposals | ✅ Built |
| Vendor invoice CRUD (3a) | ✅ Built — project detail |
| Vendor payment settings (3b) | ✅ Built — `/dashboard/payments` (separate from signup today) |
| Client card pay + P2P (3c) | ✅ Built — Stripe Checkout + P2P links + claim flow |
| Client payment UX polish | ✅ Done — prominent buttons, Home redirect, paid polling |
| Vendor payment at signup | 📋 **Next** — integrate P2P + optional Stripe into onboarding |
| Monetization plan (vendor → PortalHub subscription) | 📋 Phase 3e — see `monetization.md` |

## Next Session — Priority Order

1. **Vendor onboarding wizard** — after register (or as signup steps): business name + **payment setup**
   - **Tier A:** P2P handles (Venmo, Zelle, Cash App, PayPal) — quick, no Stripe required
   - **Tier B:** Same + **Stripe Connect** for card pay in client portal
   - Allow “skip Stripe for now” but require at least one P2P method OR explicit “I’ll set up later” with dashboard reminder
2. **Vendor flow polish** — checklist on dashboard (project → payments → invite → invoice); guard/warn when sending invoice without payment methods
3. **End-to-end test** — full vendor path: register → pay setup → project → invoice → client pays → vendor marks paid
4. **Stripe dev config** (optional) — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, webhook `/api/webhooks/stripe`
5. **Monetization plan** — Phase 3e vendor subscription billing before launch

## Payment Architecture (Agreed)

**Two separate money flows:**

| Flow | Who pays whom | Mechanism | Status |
|------|---------------|-----------|--------|
| **Client → Vendor** | Couple pays vendor for invoices | Stripe Connect (card) + P2P handles | ✅ Built |
| **Vendor → PortalHub** | Vendor pays platform subscription | Stripe Billing | 📋 Phase 3e / pre-launch |

**Client invoice payments (built):**
- Vendor configures handles + Stripe at `/dashboard/payments` *(today — moving to onboarding)*
- Vendor creates/sends invoices on project detail
- Client pays via card (Checkout) or P2P (clickable Venmo/Cash App/PayPal links + Zelle copy)
- Client “I've sent payment” → vendor marks paid; client auto-redirects to Home with banners
- Poll on Payments tab detects vendor “mark paid” → client Home success banner

**Key files:** `server/src/models/Invoice.ts`, `VendorPaymentSettings.ts`, `stripeService.ts`, `client/src/pages/VendorPaymentSettings.tsx`, `ClientPortal.tsx`, `client/src/utils/p2pPaymentLinks.ts`

## Database Status
- [x] `schema_portalhub.sql` applied
- [x] `schema_payments_addition.sql` applied (user confirmed `vendor_payment_settings`)
- [x] Dev seed applied (test logins in `techContext.md`)
- [ ] **`schema_quotes_addition.sql`** — confirm applied if using quotes
- [ ] **`schema_contract_ack_enhancement.sql`** — confirm applied if using enhanced e-sign

## Key Routes (current)

| Path | Role | Purpose |
|------|------|---------|
| `/register` | Public | Vendor self-signup (account only today — no payment setup yet) |
| `/dashboard` | VENDOR | Project list + create |
| `/dashboard/projects/:id` | VENDOR | Project detail (invite, contract, deliverables, invoices) |
| `/dashboard/quotes` | VENDOR | Quote list + create |
| `/dashboard/quotes/:id` | VENDOR | Quote detail, convert to project |
| `/dashboard/payments` | VENDOR | Stripe Connect + P2P handles |
| `/portal` | CLIENT | Mobile-first client hub |
| `/invite/:token` | Public | Client account creation |
| `/quote/:token` | Public | Client quote review + accept/decline |

## Confirmed Product Decisions

| Decision | Choice |
|----------|--------|
| Client accounts | One login per couple |
| Login UX | Single login page with role-based redirect |
| Login timing | At **invite acceptance**, not at contract acknowledgement |
| **Vendor onboarding (next)** | **Payment setup during signup** — P2P required path; Stripe Connect optional same flow |
| Payments (MVP) | Stripe Connect card pay + P2P; vendor marks P2P paid; 0% platform fee at launch |
| Contracts (MVP) | PDF upload + electronic signature (audit trail) |
| One client per project (MVP) | Enforced in API + UI |
| One contract per project (MVP) | Enforced on upload |

## Active Technical Decisions
- Monorepo: `client/`, `server/`, `database/`
- File storage: `uploads/contracts/{projectId}/`, `uploads/deliverables/{projectId}/`
- Auth-scoped file download for clients (not public static URLs)
- Stripe webhook uses raw body at `/api/webhooks/stripe` (before JSON parser)
- **Git commits:** user only
- **Database migrations:** user applies SQL in pgAdmin

## Open Questions (Deferred)
- Exact signup wizard steps (single page vs multi-step vs post-register redirect)
- Whether business name becomes required at signup
- Email delivery provider for invites and quotes
- **Monetization** — pricing model, tiers, free trial, Stripe Billing timeline (see `monetization.md`)
