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
| **Vendor** | Primary investment — quoting, projects, clients, contracts, invoices, workflow efficiency | Can be denser and more capable; optimize for *fewer steps* and *clear process* |
| **Client** | Constrained surface — status, next action, documents, payments | Must pass the **3-second test**; no CRM jargon; mobile-first; zero training |

**Implication for roadmap:** New features are designed **vendor-first**; the client only sees what they need to act on (accept quote, sign contract, pay invoice, download files) — never vendor admin complexity.

## Current Work Focus

**Session (June 20, 2026).** Public landing + auth visual refresh done. **Starter plan gating** implemented in code (1 active project, 3 quotes/month) — requires migration `011`. Stripe Billing still pending for paid upgrades.

**Next up:** User runs migration `011` in pgAdmin; deploy; family UAT; Stripe Billing when ready.

**Deferred for later (user confirmed):** Vendor calendar **personal entries** — migration `011` (see Planned Features).

**Deferred for later (user confirmed):** Apply `MarketingAuthLayout` to client **invite registration** (`AcceptInvite.tsx`) — intentionally left on gray layout for now.

## When You Return — Start Here

1. **Family UAT** — send `docs/family-uat-guide.md` with live logins + quote/invite links filled in; collect screenshots/notes
2. **Triage UAT feedback** — mobile UX, 3-second test, payment flow clarity
3. **Commit pending work** if not yet committed (portal branding, contract re-upload, iframe auth, UAT doc)
4. **Production uploads volume** — confirmed at **`/app/server/uploads`**; re-upload fixes missing `contracts/` tree; verify PDF survives redeploy
5. **E2E — full vendor path** (quote → accept → sign → convert → invite → portal sign) — largely validated on prod project #6
6. **E2E — payments path** — deposit invoice, P2P claim, optional Stripe Checkout
7. **Launch prep:** Register **smoothgig.com**, favicon/logo, trademark check

## Next Session — Priority Order

1. **Family UAT results** — fix blockers from wife/MIL feedback (especially mobile client portal)
2. **Commit + deploy** any UAT fixes
3. **E2E — payments path** (deposit invoice, P2P claim, optional Stripe Checkout)
4. **Volume persistence test** — redeploy and confirm `uploads/contracts/` PDFs still load
5. **Stripe (client pay)** — vendor-hosted Payment Link only; no platform Connect
6. **Phase 3e:** Platform vendor subscription billing (pre-launch)
7. **Future:** Vendor calendar personal entries — migration `011` (deferred)

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
- Likely migration **`011_vendor_calendar_entries.sql`** + CRUD API + day-click UI on `/dashboard/calendar`
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
| `010_drop_deliverables.sql` | Drop unused deliverables table | ✅ |
| `reset/seed_portalhub_dev.sql` | Dev test accounts (Miller Celebration) | ✅ (optional) |
| `reset/reset_keep_seed.sql` | Clear test data, keep seed | ✅ |
| `reset/wipe_and_reseed_dev.sql` | Full wipe + fresh seed | ✅ |

## Key Routes (current)

| Path | Role | Purpose |
|------|------|---------|
| `/` | Public | **Marketing landing** (vendors); logged-in users redirect to role home |
| `/login` | Public | Shared sign-in |
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
| Payments (MVP) | Stripe Connect Express + P2P; **0% SmoothGig platform fee (permanent)** |
| One client per project (MVP) | Enforced in API + UI |

## Active Technical Decisions
- Monorepo: `client/`, `server/`, `database/`
- File storage: `uploads/contracts/{projectId}/`, `uploads/quote-contracts/{quoteId}/` (legacy `uploads/deliverables/` may exist on disk but is unused)
- **Production:** Mount persistent volume at `/app/server/uploads` (Coolify) — container disk is ephemeral without it
- Auth-scoped file download for portal contracts; quote contracts public via token URL
- **Portal contract PDF iframe:** same-origin `/api/portal/contracts/:id/file?access_token=JWT` — iframes cannot send `Authorization` header; `protect` middleware accepts query token on **GET only**; helmet `frameSrc: ['self']` (no blob URLs)
- **Signed contract view (new tab):** authenticated blob fetch + `URL.createObjectURL` (not iframe)
- **Date display:** User-facing dates = **MM-DD-YYYY** via `formatUsDate()` / `formatUsDateTime()` in `client/src/utils/calendarHelpers.ts`; API/DB stay `YYYY-MM-DD`
- Stripe webhook: raw body at `/api/webhooks/stripe`
- **Git commits / push:** user only
- **Database migrations:** user applies SQL in pgAdmin; numbered `NNN_*.sql` in `database/` (next: `011`)

## Planned Features (Post-MVP / Later)

| Feature | Why | Target |
|---------|-----|--------|
| **Vendor calendar personal entries** | Ease of use — vendors need one place for gigs *and* personal reminders (payments due, off-book work, blocked days) | Migration `011` + calendar CRUD UI |
| Stripe Connect OAuth | Link existing Stripe account | ✅ Built |
| Platform subscription (Phase 3e) | Vendor → platform billing | Pre-launch |
| Invoice due dates on calendar | Optional overlay from existing invoices | Could ship with or after `011` |

## Session Log (landing page — vendor marketing)

## Session Log (pricing model confirmed)

- [x] **No SmoothGig platform fees** on client payments — subscription revenue only
- [x] **Founding Pro:** $19/mo · $199/yr — first **50** subscribers, **price locked for life** while subscribed
- [x] **Standard Pro:** $29/mo · $299/yr — after founding cap
- [x] Card pay: Stripe standard processing fees only (vendor Connect)
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

## Session Log (June 20, 2026 — vendor-hosted Stripe)

- [x] **Path B:** Removed Stripe Connect + in-portal Checkout for client invoices
- [x] Vendors paste Stripe Payment Link URL in payment settings / onboarding
- [x] Client portal opens vendor link in new tab; claim-sent flow for vendor confirmation
- [x] Migration `013_vendor_stripe_payment_link.sql` — user applies in pgAdmin
- [x] Platform Stripe env vars needed **only** for Pro subscription billing

## Session Log (June 20, 2026 — Stripe Connect OAuth)

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
- Pre-fill business name from register `company` in onboarding
- Transactional email provider for invites and quotes (vs mailto MVP)
- Enforce “booked client” status in DB vs informational UX only
- Monetization tiers and Stripe Billing timeline (`monetization.md`)
