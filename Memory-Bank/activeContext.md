# Active Context: SmoothGig

## Product Name
**SmoothGig** — official product name (`smoothgig.com` available; register domain when ready). UI wordmark splits **Smooth** + **Gig** via `AppName` component; plain `APP_NAME` string for prose/meta/email. Vendor-facing branding (logo, colors, business name) is per-vendor inside the app. **Rejected:** Gigly (gigly.com taken, June 2026).

**Branding files:**
- `client/src/constants/branding.ts` — `APP_NAME`, `APP_NAME_PARTS`, `APP_TAGLINE`, `APP_DOMAIN`
- `client/src/components/branding/AppName.tsx` — two-part wordmark (accent on **Gig**)

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

**Session ended (June 20, 2026).** User committed **app-wide US date format** (`MM-DD-YYYY`). Prior session work (rebrand, polish, migrations `008`/`009`, quote-contract fixes) is deployed or ready to deploy.

**Deferred for later (user confirmed):** Vendor calendar **personal entries** — notes/reminders on days (payments due, off-book obligations, unavailable blocks). See **Planned Features** below.

## When You Return — Start Here

1. **Deploy latest client + server** to production (includes US date format, quote contract multipart fix, CSP iframe fix, mobile quote layout).
   - **If you see `Not Found - /api/vendor/calendar|dashboard|notifications|profile`:** production is running an **old server build** while the client is new. Force a **full Coolify redeploy** from latest `main` (clear build cache). Startup logs should show `CODE VERSION: v2.2.0-vendor-routes`.
2. **Production uploads volume** — confirm Coolify persistent volume mounted at **`/app/server/uploads`**; re-upload any quote contracts that 404’d before the volume was set.
3. **Confirm migrations `002`–`007`** in pgAdmin if quote/contract/onboarding flows ever fail (see Database Status table). **`008` + `009` are applied.**
4. **E2E test — full vendor path:**
   - Register → onboarding → quote **with contract PDF** → client link → view/sign PDF → convert → invite → portal
   - Verify contract PDF survives **redeploy** (volume test)
5. **E2E test — payments path:** Project payment setup → deposit invoice → client P2P + optional Stripe card pay
6. **Verify notifications + email** (needs `009` + optional SMTP env vars)
7. **Launch prep (non-code):** Register **smoothgig.com**, favicon/logo, trademark check

## Next Session — Priority Order

1. **Production smoke after deploy** — quote PDF iframe loads (no CSP blob error); event dates show `MM-DD-YYYY` everywhere
2. **E2E — new vendor full path** (quote + contract + accept + sign + convert + invite + portal)
3. **E2E — payments path** (deposit invoice, P2P claim, optional Stripe Checkout)
4. **Stripe Connect UX** — OAuth “link existing account” vs Express-only — decide and implement
5. **Polish:** Pre-fill business name from register `company` in onboarding step 1
6. **Phase 3e:** Platform vendor subscription billing (pre-launch)
7. **Future:** Vendor calendar personal entries — migration `010` (deferred)

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
| Vendor calendar (derived availability) | ✅ Built |
| Vendor command center dashboard | ✅ Built |
| In-app notifications + bell | ✅ Built (SQL `009`) |
| Transactional email (SMTP) | ✅ Built (env-configured) |
| Quote/project pipeline steppers | ✅ Built |
| Vendor branding settings page | ✅ Built |
| **SmoothGig platform rebrand + wordmark** | ✅ Built (June 2026) |
| Client card pay + P2P (3c) | ✅ Built |
| Vendor onboarding wizard + gate | ✅ Built |
| Dashboard vendor checklist | ✅ Built |
| Invoice send guard | ✅ Built |
| Event-neutral UI copy (`eventDate`, `clientDisplayName`) | ✅ Done |
| **US date display (`MM-DD-YYYY` app-wide)** | ✅ Built (June 20, 2026) |
| Quote contract upload + re-upload API | ✅ Built |
| Quote contract iframe (CSP-safe API URLs) | ✅ Built — redeploy required |
| Mobile-responsive quote document layout | ✅ Built |
| Stripe Connect **OAuth** (link existing Stripe account) | 📋 Discussed — not built |
| Monetization (vendor → platform subscription) | 📋 Phase 3e — see `monetization.md` |

## Payment Architecture (Agreed)

**Two separate money flows:**

| Flow | Who pays whom | Mechanism | Status |
|------|---------------|-----------|--------|
| **Client → Vendor** | Client pays vendor for invoices | Stripe Connect (card) + P2P handles | ✅ Built (Express Connect today) |
| **Vendor → platform** | Vendor pays platform subscription | Stripe Billing | 📋 Phase 3e / pre-launch |

**Client invoice payments (built):**
- Vendor configures handles + Stripe at onboarding and `/dashboard/payments`
- Vendor creates/sends invoices on project detail
- Client pays via card (Checkout) or P2P; “I've sent payment” → vendor marks paid; Home redirect + polling

**Guided invoice workflow (built — SQL `008` applied):**
- Project-level payment setup stores project total + payment structure (`pay_in_full`, `deposit_and_balance`, `split_payments`)
- Vendors can save deposit defaults and due-day guidance on project detail
- Invoice drafts now support `invoiceKind` (`deposit`, `payment`, `final`, `custom`)
- Deposit/final presets prefill invoice title, amount, and due date guidance for vendors
- Client portal next action and payment labels now distinguish deposits from other invoices

**Vendor calendar (Phase 1 — built, read-only):**
- Derived from existing project + quote event dates (no personal-entry table yet)
- Booked = non-cancelled projects with an event date
- Tentative = sent/accepted quotes with an event date (until converted/booked)
- Cancelled projects free their date
- Calendar page at `/dashboard/calendar`; quote create uses schedule-aware date picker
- Click event → project/quote detail; **no add/edit on empty days**

**Vendor calendar (Phase 2 — planned, not built):**
- Personal calendar entries vendors create/edit/delete themselves
- Use cases: payment due reminders, off-book gigs/obligations, travel/prep, “unavailable” blocks
- Likely migration **`010_vendor_calendar_entries.sql`** + CRUD API + day-click UI on `/dashboard/calendar`
- Display alongside booked/tentative events (distinct visual style); optional: mark day busy for quote date picker
- **Not in scope for current E2E / MVP launch** — build after core vendor path is validated

**Vendor product polish (priorities 1–5 — built):**
- Command center home: attention queue, stats, upcoming events, quick actions
- Persistent notifications (`009`) + bell + realtime toasts via Socket.io
- Transactional email for quotes, invites, invoices when `SMTP_HOST` + `SMTP_FROM` are set
- Pipeline progress steppers on quote detail and project detail
- `/dashboard/settings` for logo, colors, tagline; branded vendor header shell

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
| `005_schema_vendor_onboarding.sql` | `payment_setup_complete` flag | ⬜ Confirm |
| `006_schema_quote_contract_addition.sql` | `quote_contracts` table | ⬜ Confirm |
| `007_schema_quote_contract_signing.sql` | Quote contract e-sign fields | ⬜ Confirm |
| `008_project_payment_settings.sql` | Project payment setup + invoice kind metadata | ✅ |
| `009_vendor_notifications.sql` | In-app vendor notifications | ✅ |
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
| `/dashboard/calendar` | VENDOR | Month/agenda view of booked + tentative events |
| `/dashboard/settings` | VENDOR | Branding, logo, colors, business profile |
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
- **Production:** Mount persistent volume at `/app/server/uploads` (Coolify) — container disk is ephemeral without it
- Auth-scoped file download for portal contracts; quote contracts public via token URL
- Contract PDF iframes use **same-origin API URLs** (not blob URLs) — helmet `frameSrc: ['self']`
- **Date display:** User-facing dates = **MM-DD-YYYY** via `formatUsDate()` / `formatUsDateTime()` in `client/src/utils/calendarHelpers.ts`; API/DB stay `YYYY-MM-DD`
- Stripe webhook: raw body at `/api/webhooks/stripe`
- **Git commits / push:** user only
- **Database migrations:** user applies SQL in pgAdmin; numbered `NNN_*.sql` in `database/` (next: `010`)

## Planned Features (Post-MVP / Later)

| Feature | Why | Target |
|---------|-----|--------|
| **Vendor calendar personal entries** | Ease of use — vendors need one place for gigs *and* personal reminders (payments due, off-book work, blocked days) | Migration `010` + calendar CRUD UI |
| Stripe Connect OAuth | Link existing Stripe account | TBD |
| Platform subscription (Phase 3e) | Vendor → platform billing | Pre-launch |
| Invoice due dates on calendar | Optional overlay from existing invoices | Could ship with or after `010` |

## Session Log (June 20, 2026 — end of session)

### Quote / contract reliability
- [x] Fixed quote contract PDF not attaching — strip broken `Content-Type` on FormData; `api.ts` interceptor; relaxed PDF mime; rollback quote if attach fails
- [x] `POST /api/vendor/quotes/:id/contract` — attach/replace contract after create
- [x] Re-upload UI on vendor quote detail when file missing on disk
- [x] CSP fix — contract iframes use API URLs; helmet `frameSrc` / `objectSrc`
- [x] Mobile quote document — stacked line items on small screens

### US date format (committed)
- [x] `formatUsDate()` / `formatUsDateTime()` in `calendarHelpers.ts`
- [x] All user-facing dates **MM-DD-YYYY** (quotes, portal, projects, calendar, invoices, notifications)
- [x] `formatEventDate()` / `formatCalendarDate()` delegate to shared formatter
- [x] API/storage unchanged (`YYYY-MM-DD`)

### Prior this session (already committed)
- [x] SmoothGig rebrand + vendor polish (dashboard, notifications, email, pipeline, settings)
- [x] Migrations `008` + `009` applied in pgAdmin

## Open Questions (Deferred)
- **Stripe Connect:** OAuth “link existing account” vs Express-only — implement next?
- Pre-fill business name from register `company` in onboarding
- Transactional email provider for invites and quotes (vs mailto MVP)
- Enforce “booked client” status in DB vs informational UX only
- Monetization tiers and Stripe Billing timeline (`monetization.md`)
