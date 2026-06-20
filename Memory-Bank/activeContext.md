# Active Context: PortalHub (placeholder)

## Product Name
**PortalHub** — generic placeholder for the platform. Vendor-facing branding (logo, colors) is per-vendor inside the app; this name is only for the product itself until a final name is chosen.

## End Goal (Product North Star)

**Streamline vendor business processes on the dashboard; keep the client portal simple and easy to use.**

**Market entry angle:** Address documented competitor pain points — unreliable email, clunky mobile portals, hard-to-find info, payment friction, communication fragmentation. See `competitivePainPoints.md`.

**Positioning:** Event vendors (weddings, corporate, private parties, etc.) — vendors name projects whatever they want; **system copy** uses neutral “event” / “client” language, not wedding-specific defaults.

| Side | Focus | UX bar |
|------|--------|--------|
| **Vendor** | Primary investment — quoting, projects, clients, contracts, invoices, deliverables, workflow efficiency | Can be denser and more capable; optimize for *fewer steps* and *clear process* |
| **Client** | Constrained surface — status, next action, documents, payments, files | Must pass the **3-second test**; no CRM jargon; mobile-first; zero training |

**Implication for roadmap:** New features are designed **vendor-first**; the client only sees what they need to act on (accept quote, sign contract, pay invoice, download files) — never vendor admin complexity.

## Current Work Focus

**Session stopped (June 17, 2026).** Major quote + contract + language work shipped in code. **No git commit** this session (user runs commits manually).

**Industry feedback integrated (wedding planner):** Client relationship = three parts (accept quote, sign contract/T&C, pay deposit). Quotes can optionally include contract PDF; contract is view-only until quote accepted, then e-sign on quote link; deposit still required after sign.

**User action before next dev session:** Run pending SQL in pgAdmin (see Database Status below).

## MVP Status

| Area | Status |
|------|--------|
| Auth + role redirect | ✅ Done |
| Vendor project list + create | ✅ Done |
| Vendor project detail + **edit overview** | ✅ Done |
| Client invite flow + duplicate-client guards | ✅ Done |
| Client portal (Home / Documents / Payments / Files) | ✅ Done |
| Contract PDF upload + enhanced e-sign audit trail | ✅ Done |
| Deliverable upload + client download | ✅ Done |
| Legacy CRM cleanup | ✅ Done (June 2026) |
| Quoting / proposals | ✅ Built |
| Quote + optional contract attachment | ✅ Built |
| Quote contract view-only → sign after accept | ✅ Built |
| Client-agreement notices (quote → client status) | ✅ Built |
| Vendor invoice CRUD (3a) | ✅ Built |
| Vendor payment settings (3b) | ✅ Built |
| Client card pay + P2P (3c) | ✅ Built |
| Vendor onboarding wizard + gate | ✅ Built |
| Dashboard vendor checklist | ✅ Built |
| Invoice send guard | ✅ Built |
| Event-neutral UI copy (`eventDate`, `clientDisplayName`) | ✅ Done |
| Stripe Connect **OAuth** (link existing Stripe account) | 📋 Discussed — not built |
| Monetization (vendor → PortalHub subscription) | 📋 Phase 3e — see `monetization.md` |

## Next Session — Priority Order

1. **Run pending SQL in pgAdmin** (numeric order — see `database/README.md`):
   - `002_schema_quotes_addition.sql` (confirm)
   - `003_schema_contract_ack_enhancement.sql`
   - `005_schema_vendor_onboarding.sql`
   - `006_schema_quote_contract_addition.sql`
   - `007_schema_quote_contract_signing.sql`
   - **Full rebuild:** `001` → `007`, then `reset/seed_portalhub_dev.sql`
2. **E2E test — full vendor path:**
   - Register → onboarding → create quote **with contract** → client accepts → client signs contract on quote link → convert to project → invite → portal contract/deposit/invoice
3. **E2E test — payments path:** onboarding → project → invoice → client P2P + optional Stripe card pay
4. **Stripe dev config** (optional): test keys + webhook for card pay
5. **Stripe Connect UX:** “Link existing Stripe account” (OAuth Standard) as primary; Express onboarding as fallback for vendors without Stripe
6. **Polish:** Pre-fill business name from register `company` in onboarding step 1
7. **Phase 3e:** PortalHub vendor subscription billing (pre-launch)

## Payment Architecture (Agreed)

**Two separate money flows:**

| Flow | Who pays whom | Mechanism | Status |
|------|---------------|-----------|--------|
| **Client → Vendor** | Client pays vendor for invoices | Stripe Connect (card) + P2P handles | ✅ Built (Express Connect today) |
| **Vendor → PortalHub** | Vendor pays platform subscription | Stripe Billing | 📋 Phase 3e / pre-launch |

**Client invoice payments (built):**
- Vendor configures handles + Stripe at onboarding and `/dashboard/payments`
- Vendor creates/sends invoices on project detail
- Client pays via card (Checkout) or P2P; “I've sent payment” → vendor marks paid; Home redirect + polling

**Guided invoice workflow (built in code, pending SQL `008`):**
- Project-level payment setup stores project total + payment structure (`pay_in_full`, `deposit_and_balance`, `split_payments`)
- Vendors can save deposit defaults and due-day guidance on project detail
- Invoice drafts now support `invoiceKind` (`deposit`, `payment`, `final`, `custom`)
- Deposit/final presets prefill invoice title, amount, and due date guidance for vendors
- Client portal next action and payment labels now distinguish deposits from other invoices

**Key files:** `Invoice.ts`, `VendorPaymentSettings.ts`, `stripeService.ts`, `VendorOnboarding.tsx`, `VendorPaymentSettings.tsx`, `ClientPortal.tsx`, `p2pPaymentLinks.ts`

## Quote → Client Agreement Flow (Built)

| Step | Where | Status |
|------|--------|--------|
| Vendor sends quote (+ optional contract) | `/dashboard/quotes` | ✅ |
| Client views quote + contract (view-only) | `/quote/:token` | ✅ |
| Client accepts quote | `/quote/:token` | ✅ |
| Client signs contract (unlocks after accept) | `/quote/:token` | ✅ |
| Deposit notice (not booked until paid) | `/quote/:token` | ✅ Informational |
| Vendor converts to project | `/dashboard/quotes/:id` | ✅ Copies contract + signature |
| Client portal: contract / deposit / invoice | `/portal` | ✅ Existing project flow |

**Key files:** `QuoteContract.ts`, `Quote.ts`, `quotes.ts` (public routes), `VendorQuotes.tsx`, `AcceptQuote.tsx`, `QuoteContractSignPanel.tsx`, `QuoteClientAgreementNotice.tsx`

## Database Status

| Migration | Purpose | User applied? |
|-----------|---------|---------------|
| `001_schema_portalhub.sql` | Base schema | ✅ |
| `002_schema_quotes_addition.sql` | Quotes + line items | ⬜ Confirm |
| `003_schema_contract_ack_enhancement.sql` | Portal contract audit fields | ⬜ Confirm |
| `004_schema_payments_addition.sql` | Payment settings + invoice fields | ✅ |
| `005_schema_vendor_onboarding.sql` | `payment_setup_complete` flag | ⬜ Run in pgAdmin |
| `006_schema_quote_contract_addition.sql` | `quote_contracts` table | ⬜ Run in pgAdmin |
| `007_schema_quote_contract_signing.sql` | Quote contract e-sign fields | ⬜ Run in pgAdmin |
| `008_project_payment_settings.sql` | Project payment setup + invoice kind metadata | ⬜ Run in pgAdmin |
| `reset/seed_portalhub_dev.sql` | Dev test accounts (Miller Celebration) | ✅ (optional) |
| `reset/reset_keep_seed.sql` | Clear test data, keep seed | ✅ |
| `reset/wipe_and_reseed_dev.sql` | Full wipe + fresh seed | ✅ |

## Key Routes (current)

| Path | Role | Purpose |
|------|------|---------|
| `/register` | Public | Vendor signup → onboarding |
| `/dashboard/onboarding` | VENDOR | Business → P2P → optional Stripe |
| `/dashboard` | VENDOR | Projects + checklist |
| `/dashboard/projects/:id` | VENDOR | Project detail + **edit overview** |
| `/dashboard/quotes` | VENDOR | Quote list + create (optional contract) |
| `/dashboard/quotes/:id` | VENDOR | Quote detail, convert to project |
| `/dashboard/payments` | VENDOR | Stripe Connect + P2P handles |
| `/portal` | CLIENT | Mobile-first client hub |
| `/invite/:token` | Public | Client account creation |
| `/quote/:token` | Public | Quote review, accept, view/sign contract |

**Public quote API:** `GET/POST /api/quotes/:token/...`, `GET .../contract`, `POST .../contract/acknowledge`

## Confirmed Product Decisions

| Decision | Choice |
|----------|--------|
| Target market | Event vendors (weddings + other events); vendor-chosen project titles |
| System language | Neutral “event” / “client” — no wedding-default copy in platform UI |
| API fields | `eventDate`, `clientDisplayName` (DB: `wedding_date`, `couple_display_name`) |
| Client accounts | One login per client account |
| **Client relationship** | Not a booked client until: **accept quote + sign contract/T&C + pay deposit** |
| **Quote + contract** | Optional attachment at quote create; view-only until accept; then e-sign on quote link |
| After contract sign on quote | Informational deposit notice; vendor follows up with invoice |
| Vendor onboarding | Payment setup at signup (P2P required path; Stripe optional) |
| Payments (MVP) | Stripe Connect Express + P2P; 0% platform fee at launch |
| One client per project (MVP) | Enforced in API + UI |

## Active Technical Decisions
- Monorepo: `client/`, `server/`, `database/`
- File storage: `uploads/contracts/{projectId}/`, `uploads/deliverables/{projectId}/`, `uploads/quote-contracts/{quoteId}/`
- Auth-scoped file download for portal contracts; quote contracts public via token URL
- Stripe webhook: raw body at `/api/webhooks/stripe`
- **Git commits / push:** user only
- **Database migrations:** user applies SQL in pgAdmin; numbered `NNN_*.sql` in `database/` (next: `009`)

## Open Questions (Deferred)
- **Stripe Connect:** OAuth “link existing account” vs Express-only — implement next?
- Pre-fill business name from register `company` in onboarding
- Transactional email provider for invites and quotes (vs mailto MVP)
- Enforce “booked client” status in DB vs informational UX only
- Monetization tiers and Stripe Billing timeline (`monetization.md`)
