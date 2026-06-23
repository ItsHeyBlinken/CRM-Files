# Active Context: SmoothGig

## Product Name
**SmoothGig** — official product name (`smoothgig.com` available; register domain when ready). UI wordmark splits **Smooth** + **Gig** via `AppName` component; plain `APP_NAME` string for prose/meta/email. Vendor-facing branding (logo, colors, business name) is per-vendor inside the app. **Rejected:** Gigly (gigly.com taken, June 2026).

**Branding files:**
- `client/public/smoothgig-logo.png` — platform logo asset (favicon + marketing UI)
- `client/src/constants/branding.ts` — `APP_NAME`, `APP_TAGLINE`, `PLATFORM_LOGO_SRC`
- `client/src/components/branding/PlatformLogo.tsx` — logo image for landing, auth, onboarding
- `client/src/components/branding/AppName.tsx` — text wordmark fallback (vendor shell when no business name)

## End Goal (Product North Star)

**Streamline vendor business processes on the dashboard; keep the client portal simple and easy to use.**

**Market entry angle:** Address documented competitor pain points — unreliable email, clunky mobile portals, hard-to-find info, payment friction, communication fragmentation. See `competitivePainPoints.md`.

**Positioning:** Event vendors (weddings, corporate, private parties, etc.) — vendors name projects whatever they want; **system copy** uses neutral “event” / “client” language, not wedding-specific defaults.

| Side | Focus | UX bar |
|------|--------|--------|
| **Vendor** | Primary investment — quoting, projects, clients, contracts, invoices, workflow efficiency | Can be denser and more capable; optimize for *fewer steps* and *clear process* |
| **Client** | Constrained surface — status, next action, documents, payments | Must pass the **3-second test**; no CRM jargon; mobile-first; zero training |

**Implication for roadmap:** New features are designed **vendor-first**; the client only sees what they need to act on (accept quote, sign contract, pay invoice, download files) — never vendor admin complexity.

## Current Work Focus

**Session end (June 20, 2026 — night).** **Client card pay = Path B (vendor-hosted Stripe Payment Link).** Stripe Connect and in-portal Checkout were removed. Vendors paste their own Payment Link; clients open it in a new tab; vendor confirms payment in app. **Migration `013`** adds `stripe_payment_link` column — user to apply in pgAdmin before deploy.

**Also in codebase (prior sessions, may need commit/deploy):** Starter plan gating (`011`), Stripe Billing for Pro (`012`), landing/auth refresh, family UAT doc.

**Next up:** Apply migration `013` → commit + deploy → E2E payments path (P2P + Stripe link) → family UAT.

**Deferred for later (user confirmed):** Vendor calendar **personal entries** — future migration (not `011`; plan uses separate calendar migration). Apply `MarketingAuthLayout` to `AcceptInvite.tsx`.

## When You Return — Start Here

1. **Apply migration `013`** in pgAdmin (`database/013_vendor_stripe_payment_link.sql`)
2. **Commit + deploy** Stripe Path B changes (if not yet committed)
3. **E2E — payments path** — vendor adds Payment Link + P2P handles → send invoice → client opens Stripe link + claim-sent → vendor marks paid
4. **Family UAT** — `docs/family-uat-guide.md`; collect feedback on mobile client portal
5. **Confirm migrations `011` + `012`** applied if testing Pro upgrade / plan limits
6. **Production uploads volume** — `/app/server/uploads`; verify contract PDFs survive redeploy
7. **Launch prep:** Register **smoothgig.com**, favicon/logo

## Next Session — Priority Order

1. **Migration `013`** in pgAdmin + deploy
2. **E2E payments** — Stripe Payment Link + P2P + claim-sent + vendor mark paid
3. **Family UAT results** — fix blockers (especially mobile client portal)
4. **Commit** any uncommitted session work
5. **Pro billing smoke test** — migrations `011`/`012`, Checkout upgrade, plan limits
6. **Volume persistence test** — redeploy; confirm `uploads/contracts/` PDFs load
7. **Future:** Vendor calendar personal entries (separate migration)

## MVP Status

| Area | Status |
|------|--------|
| Auth + role redirect | ✅ Done |
| Vendor project list + create | ✅ Done |
| Vendor project detail + **edit overview** | ✅ Done |
| Client invite flow + duplicate-client guards | ✅ Done |
| Client portal (Home / Documents / Payments) | ✅ Done |
| Client portal vendor branding (logo, tagline) | ✅ Done |
| Contract PDF upload + enhanced e-sign audit trail | ✅ Done |
| Deliverable upload + client download | ❌ Removed (external gallery tools) |
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
| Quote contract iframe (CSP-safe public API URLs) | ✅ Built |
| **Portal contract iframe (auth via `access_token` query on GET)** | ✅ Built + verified prod |
| Project contract re-upload when PDF missing on disk | ✅ Built |
| Mobile-responsive quote document layout | ✅ Built |
| Stripe Payment Link (vendor-hosted card pay) | ✅ Built (June 20, 2026) |
| Monetization (vendor subscription) | ✅ Model confirmed — see `monetization.md` |

## Payment Architecture (Agreed)

**Two separate money flows:**

| Flow | Who pays whom | Mechanism | Status |
|------|---------------|-----------|--------|
| **Client → Vendor** | Client pays vendor for invoices | Vendor Stripe link + P2P handles | ✅ Built (vendor-hosted Stripe link) |
| **Vendor → platform** | Vendor pays SmoothGig subscription | Stripe Billing | 📋 Phase 3e — pricing confirmed in `monetization.md` |

**Fee policy (confirmed):** SmoothGig charges **no platform fee** on client payments. Vendors pay **subscription only**. Card processing = **Stripe standard fees on the vendor's own Stripe account** (SmoothGig does not process client card payments).

**Client invoice payments (built — Path B):**
- Vendor pastes **Stripe Payment Link** (from their own Stripe Dashboard) at onboarding or `/dashboard/payments`
- Vendor also configures P2P handles (Venmo, Zelle, etc.)
- Client portal: **Pay with card (Stripe)** opens vendor link in new tab; **I've sent payment** notifies vendor
- Vendor marks invoice paid after confirming receipt (same as P2P)
- **SmoothGig does not use Stripe Connect** for client pay — no platform involvement in vendor card processing

**Platform Stripe (SmoothGig account only):**
- Pro subscription billing (Stripe Billing) — see `012`, `stripeBillingService.ts`
- Webhook `/api/webhooks/stripe` — subscription checkout + lifecycle only (not client invoices)

**Known gap (Path B today):** Vendor default Payment Link is **not** tied to a specific SmoothGig invoice amount. Client sees correct amount in portal but Stripe link may be generic/fixed. **Planned fix:** per-invoice Stripe pay URL — see [Planned: Path B+ per-invoice Stripe pay](#planned-path-b-per-invoice-stripe-pay-no-connect).

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
- Likely migration **`011_vendor_calendar_entries.sql`** + CRUD API + day-click UI on `/dashboard/calendar`
- Display alongside booked/tentative events (distinct visual style); optional: mark day busy for quote date picker
- **Not in scope for current E2E / MVP launch** — build after core vendor path is validated

**Vendor product polish (priorities 1–5 — built):**
- Command center home: attention queue, stats, upcoming events, quick actions
- Persistent notifications (`009`) + bell + realtime toasts via Socket.io
- Transactional email for quotes, invites, invoices when `SMTP_HOST` + `SMTP_FROM` are set
- Pipeline progress steppers on quote detail and project detail
- `/dashboard/settings` for logo, colors, tagline; branded vendor header shell

**Key files:** `VendorPaymentSettings.ts`, `stripePaymentLink.ts` (URL validation), `VendorPaymentSettings.tsx`, `VendorOnboarding.tsx`, `ClientPortal.tsx`, `portalPaymentService.ts`, `p2pPaymentLinks.ts`, `stripeService.ts` (subscriptions webhook only)

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
| `010_drop_deliverables.sql` | Drop unused deliverables table | ✅ |
| `011_vendor_plan.sql` | `vendor_profiles.plan` (starter/pro gating) | ⬜ User applies |
| `012_vendor_stripe_billing.sql` | Pro subscription Stripe columns | ⬜ User applies |
| `013_vendor_stripe_payment_link.sql` | `stripe_payment_link` on vendor settings | ⬜ User applies (this session) |
| `reset/seed_portalhub_dev.sql` | Dev test accounts (Miller Celebration) | ✅ (optional) |
| `reset/reset_keep_seed.sql` | Clear test data, keep seed | ✅ |
| `reset/wipe_and_reseed_dev.sql` | Full wipe + fresh seed | ✅ |

## Key Routes (current)

| Path | Role | Purpose |
|------|------|---------|
| `/` | Public | **Marketing landing** (vendors); logged-in users redirect to role home |
| `/login` | Public | Shared sign-in |
| `/register` | Public | Vendor signup → onboarding |
| `/dashboard/onboarding` | VENDOR | Business → P2P → optional Stripe Payment Link |
| `/dashboard` | VENDOR | Projects + checklist |
| `/dashboard/projects/:id` | VENDOR | Project detail + **edit overview** |
| `/dashboard/quotes` | VENDOR | Quote list + create (optional contract) |
| `/dashboard/quotes/:id` | VENDOR | Quote detail, convert to project |
| `/dashboard/calendar` | VENDOR | Month/agenda view of booked + tentative events |
| `/dashboard/settings` | VENDOR | Branding, logo, colors, business profile |
| `/dashboard/payments` | VENDOR | P2P handles + optional Stripe Payment Link URL |
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
| Vendor onboarding | Payment setup at signup (P2P and/or Stripe link; can skip) |
| Payments (MVP) | Vendor-hosted Stripe Payment Link + P2P; **0% SmoothGig platform fee (permanent)**; **no Stripe Connect** |
| One client per project (MVP) | Enforced in API + UI |

## Active Technical Decisions
- Monorepo: `client/`, `server/`, `database/`
- File storage: `uploads/contracts/{projectId}/`, `uploads/quote-contracts/{quoteId}/` (legacy `uploads/deliverables/` may exist on disk but is unused)
- **Production:** Mount persistent volume at `/app/server/uploads` (Coolify) — container disk is ephemeral without it
- Auth-scoped file download for portal contracts; quote contracts public via token URL
- **Portal contract PDF iframe:** same-origin `/api/portal/contracts/:id/file?access_token=JWT` — iframes cannot send `Authorization` header; `protect` middleware accepts query token on **GET only**; helmet `frameSrc: ['self']` (no blob URLs)
- **Signed contract view (new tab):** authenticated blob fetch + `URL.createObjectURL` (not iframe)
- **Date display:** User-facing dates = **MM-DD-YYYY** via `formatUsDate()` / `formatUsDateTime()` in `client/src/utils/calendarHelpers.ts`; API/DB stay `YYYY-MM-DD`
- Stripe webhook: raw body at `/api/webhooks/stripe` — **Pro subscriptions only** (not client invoice pay)
- **Client card pay:** vendor `stripe_payment_link` on settings (default) + **planned** per-invoice URL (`014`); validated as `https://*.stripe.com`; no Connect
- **Git commits / push:** user only
- **Database migrations:** user applies SQL in pgAdmin; numbered `NNN_*.sql` in `database/` (next new migration: `014`)

## Planned Features (Post-MVP / Later)

| Feature | Why | Target |
|---------|-----|--------|
| **Path B+ — per-invoice Stripe pay URL** | Easy vendor UX **without** platform Connect; correct amount on Stripe per bill | See section below — **user approved to implement later** |
| **Vendor calendar personal entries** | Off-book gigs, payment reminders, blocked days | Future migration + calendar CRUD |
| Platform subscription (Phase 3e) | Vendor → platform billing | Built in code — needs `011`/`012` + deploy |
| Invoice due dates on calendar | Optional overlay | Post-MVP |

## Planned: Path B+ per-invoice Stripe pay (no Connect)

**Decision (June 20, 2026):** User wants vendor-friendly Stripe pay **without** enabling Stripe Connect on the platform. Rejected for now: Connect OAuth / in-portal Checkout (requires platform Connect). **Approved for later:** per-invoice pay links + vendor UX helpers.

### Problem (current Path B)
- SmoothGig invoice = source of truth for amount, due date, status, client UX
- Vendor-level `stripe_payment_link` = one generic URL; **not** synced to each invoice amount
- Vendor may need a separate Stripe Payment Link/Invoice in Dashboard per amount anyway

### Target UX (Path B+)
1. Vendor creates/sends invoice in SmoothGig (unchanged)
2. Vendor creates matching Payment Link or Stripe Invoice in **their** Dashboard (~1 min)
3. Vendor pastes that URL **on the SmoothGig invoice** (new optional field) — or at send time
4. Client portal **Pay with card** opens **invoice-specific** URL if set; else vendor default from payment settings
5. Client **I've sent payment** → vendor marks paid (unchanged)

### Implementation sketch (when built)
| Layer | Work |
|-------|------|
| **DB** | Migration `014`: `invoices.stripe_payment_link TEXT` (nullable); reuse `stripePaymentLink.ts` validation |
| **API** | Include on invoice create/update/send; expose in portal payload per open invoice |
| **Vendor UI** | Invoice form / send modal: optional Stripe pay URL; helper: show amount, copy `$X.XX`, link to Stripe Payment Links docs |
| **Client UI** | `handlePayWithCard` uses `invoice.stripePaymentLink ?? paymentOptions.stripePaymentLink` |
| **Copy** | Clarify: SmoothGig invoice = bill in app; Stripe URL = where card is charged; no Connect required |

### Explicitly not in scope for Path B+
- Auto-generating Stripe checkout for invoice amount (requires **Connect** or vendor secret key — out of scope)
- Platform webhooks marking invoices paid from Stripe (vendor confirms manually unless Connect returns)

### Alternative deferred (only if vendor UX still too heavy)
- **Connect OAuth** — one-time platform Connect setup; vendors link existing accounts; SmoothGig creates Checkout per invoice with correct amount. User prefers to avoid Connect for now.

## Session Log (landing page — vendor marketing)

## Session Log (pricing model confirmed)

- [x] **No SmoothGig platform fees** on client payments — subscription revenue only
- [x] **Founding Pro:** $19/mo · $199/yr — first **50** subscribers, **price locked for life** while subscribed
- [x] **Standard Pro:** $29/mo · $299/yr — after founding cap
- [x] Card pay: Stripe standard processing fees on **vendor's own Stripe** (SmoothGig never processes client cards)
- [x] Document locked in `monetization.md`

## Session Log (landing page — vendor marketing)

- [x] **`/` public landing page** (`Landing.tsx`) — hero, pain points, 4-step flow, feature grid, client portal sell, signup CTAs
- [x] Logged-in users at `/` redirect to dashboard/portal
- [x] Login + Register: **← Back to home** links
- [x] Landing page pricing section (`Landing.tsx` — Starter, Founding Pro, Pro)

## Session Log (June 21, 2026 — evening: contracts, prod fixes, UAT prep)

### Production contract PDF issues (resolved)
- [x] Diagnosed `ENOENT` on `/app/server/uploads/contracts/{projectId}/` — DB row existed but file missing (pre-volume or never written)
- [x] Confirmed Coolify volume mount **`/app/server/uploads`** — `quote-contracts/` and `vendor-logos/` present; user re-uploaded project contract → `contracts/6/*.pdf` created
- [x] **`Contract.replaceFile`** + **`fileAvailable`** on project contracts; vendor project detail always shows re-upload/replace for unsigned contracts
- [x] Portal routes return clear 404 when file missing (`CONTRACT_FILE_MISSING`)

### Client portal contract iframe auth (resolved)
- [x] Root cause: iframe `src` to protected API without JWT → JSON `"Not authorized to access this route"`
- [x] Attempted blob URL iframe → blocked by CSP `frame-src 'self'` on production
- [x] **Final fix:** `getPortalContractFileUrl()` appends `?access_token=` from localStorage; `auth.ts` `protect` reads query token on GET
- [x] `ContractSignPanel` uses same-origin URL; detects JSON error in iframe before marking review complete
- [x] `nixpacks.toml` build check: `access_token` present in `dist/middleware/auth.js`
- [x] User confirmed portal contract sign/view **works** after redeploy

### Client portal branding (same day, earlier)
- [x] `ClientPortalHeader` — logo, business name, tagline, accent bar; API `vendorTagline`

### Family UAT
- [x] Created **`docs/family-uat-guide.md`** — vendor + client checklists, email intro, placeholders for logins/links
- [ ] User to fill placeholders and email wife/MIL for live testing on `plannercrm.bytesbyblinken.com`

### Pending user actions
- [ ] Git commit pending session changes (user commits manually)
- [ ] Run family UAT; log feedback
- [ ] Redeploy volume persistence test when convenient

## Session Log (June 21, 2026 — remove deliverables)
- [x] Removed vendor deliverables upload section and client portal **Files** tab
- [x] Contracts remain on **Documents** tab — sign + **View contract PDF** after signing
- [x] Removed deliverable API routes; **`010` — user dropped `deliverables` table in pgAdmin** (was empty)
- [x] Client portal tabs: Home / Documents / Payments only

## Session Log (June 20, 2026 — night: Stripe Path B, session end)

### Product decision
- [x] User chose **Path B** — SmoothGig stays out of vendor Stripe accounts; no Stripe Connect for client pay
- [x] Rationale: platform only needs Stripe for **Pro subscriptions**; client card pay = vendor's own Payment Link

### Implementation
- [x] Migration **`013_vendor_stripe_payment_link.sql`** — `vendor_payment_settings.stripe_payment_link`
- [x] Server: `VendorPaymentSettings.updateSettings()` + `stripePaymentLink.ts` URL validation (`https://*.stripe.com`)
- [x] Removed: Connect OAuth routes, `POST /api/portal/invoices/:id/checkout`, invoice checkout in `stripeService.ts`
- [x] Client: `/dashboard/payments` + onboarding — paste Payment Link URL; portal opens link in new tab
- [x] Client portal: claim-sent available for Stripe + P2P; vendor marks paid manually
- [x] Memory Bank + `monetization.md` updated — no Connect requirement

### Superseded (same day, reverted)
- Stripe Connect OAuth + Express onboarding — built briefly, **removed** when Path B chosen

### Pending (user)
- [ ] Apply migration **`013`** in pgAdmin
- [ ] Git commit + deploy
- [ ] E2E: vendor Payment Link → client pay flow → mark paid

## Session Log (June 20, 2026 — Path B+ planning)

- [x] User confirmed tradeoff: easy vendor UX **without** platform Connect
- [x] **Approved for later:** per-invoice Stripe pay URL on SmoothGig invoices + vendor helper UI (copy amount, paste link at send)
- [x] Client pay order: invoice-specific URL → fallback vendor default from payment settings
- [x] Deferred alternative: Connect OAuth only if per-invoice manual Stripe step still too heavy
- [x] Documented in Memory Bank (`activeContext.md` Planned Features, `progress.md`, `monetization.md`, `techContext.md`)

## Session Log (June 20, 2026 — vendor-hosted Stripe)

- [x] **Path B:** Removed Stripe Connect + in-portal Checkout for client invoices
- [x] Vendors paste Stripe Payment Link URL in payment settings / onboarding
- [x] Client portal opens vendor link in new tab; claim-sent flow for vendor confirmation
- [x] Migration `013_vendor_stripe_payment_link.sql` — user applies in pgAdmin
- [x] Platform Stripe env vars needed **only** for Pro subscription billing

## Session Log (June 20, 2026 — Stripe Connect OAuth) — SUPERSEDED

> **Do not use.** Replaced by Path B (vendor Payment Link). Connect code removed same session.

- [x] Replaced Express account creation with **Stripe Connect OAuth** — vendors link existing Stripe accounts
- [x] `POST /stripe/connect` returns OAuth authorize URL (`stripe_landing=login`)
- [x] `GET /stripe/oauth/callback` — public route exchanges code, saves `stripe_user_id`, redirects to payments/onboarding
- [x] Env: `STRIPE_CONNECT_CLIENT_ID`; optional `API_PUBLIC_URL` for OAuth redirect host
- [x] UI copy: “Connect existing Stripe account” on `/dashboard/payments` and onboarding

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

### Client portal branding
- [x] `ClientPortalHeader` — vendor logo (or accent initial), business name, tagline, accent top bar
- [x] Client name shown below branding; home card focuses on project title (no duplicate vendor name)
- [x] API: `vendorTagline` from `vendor_profiles.tagline` in `Project.findClientProject()`

### Deliverables removed
- [x] Files tab, upload UI, deliverable API routes removed; contracts remain on Documents
- [x] `database/010_drop_deliverables.sql` — user applied in pgAdmin

### Prior this session (already committed)
- [x] SmoothGig rebrand + vendor polish (dashboard, notifications, email, pipeline, settings)
- [x] Migrations `008` + `009` applied in pgAdmin

## Open Questions (Deferred)
- **Path B+ per-invoice Stripe URL** — approved for later implementation (see Planned Features in this file); not Connect
- Pre-fill business name from register `company` in onboarding
- Transactional email provider for invites and quotes (vs mailto MVP)
- Enforce “booked client” status in DB vs informational UX only
- Monetization tiers and Stripe Billing timeline (`monetization.md`)
