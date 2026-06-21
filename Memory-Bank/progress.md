# Progress: SmoothGig (Event Vendor Client Portal)

> **Note:** Product pivoted from Event Planner CRM to two-sided **event vendor** client portal. Platform name: **SmoothGig** (`smoothgig.com`). Legacy code/comments may still say PortalHub in SQL filenames — that is historical only.

## Handoff — June 20, 2026 (end of session)

**User stepped away after committing US date format.** Session also shipped quote-contract reliability fixes, CSP iframe fix, and mobile quote layout (may need separate commit/deploy if not yet pushed).

**Production checklist before E2E:**
- Deploy latest client + server to Coolify
- Persistent volume at `/app/server/uploads`
- Re-upload quote contracts lost to ephemeral storage
- Confirm migrations `002`–`007` if any quote/contract flow fails (`008` + `009` applied)

**Next session:** Deploy smoke → E2E vendor path → E2E payments → Stripe Connect OAuth decision.

## What Works

### Database Layer ✅
- **Schema Complete**: All tables created with proper relationships
- **Models Defined**: TypeScript models for all entities
- **Connection Pooling**: PostgreSQL connection configured
- **Sample Data**: Test data available for development

### Server Infrastructure ✅
- **Express Setup**: Basic server configuration complete
- **Middleware Stack**: Security, logging, and error handling configured
- **Database Connection**: PostgreSQL connection established
- **Socket.io**: Real-time communication setup
- **Authentication Middleware**: JWT and session handling ready

### Client Infrastructure ✅
- **React Setup**: Basic React application with TypeScript
- **Vite Configuration**: Fast development server configured
- **Tailwind CSS**: Styling framework integrated
- **Build System**: Development and production builds configured

## What's Left to Build

### Server Routes (In Progress)
- [x] **Auth Routes**: Login, register, logout, /me endpoint implemented ✅
- [ ] **User Routes**: User management and profiles
- [ ] **Event Routes**: CRUD operations for events
- [ ] **Vendor Routes**: Vendor management and services
- [ ] **Payment Routes**: Payment tracking and invoicing
- [ ] **Task Routes**: Task management and assignments
- [ ] **Client Routes**: Client management and profiles
- [ ] **Upload Routes**: File upload and management
- [ ] **Report Routes**: Analytics and reporting

### Client Components (In Progress)
- [x] **Authentication**: Login/register forms and logic implemented ✅
- [ ] **Dashboard**: Overview of events, tasks, and metrics
- [ ] **Client Management**: Client list, details, and forms
- [ ] **Event Management**: Event creation, editing, and tracking
- [ ] **Vendor Management**: Vendor database and service tracking
- [ ] **Task Management**: Task creation, assignment, and tracking
- [ ] **Payment Management**: Payment tracking and invoicing
- [ ] **Reporting**: Analytics dashboard and reports

### Integration (In Progress)
- [x] **API Integration**: Axios service configured, auth endpoints connected ✅
- [ ] **Real-time Updates**: Socket.io integration for live updates
- [ ] **File Upload**: Image and document upload functionality
- [x] **Authentication Flow**: Complete login/logout workflow implemented ✅
- [x] **Error Handling**: Client-side error handling and validation for auth ✅

## Current Status

### Deployment Status ✅
- **Build Process**: ✅ Working correctly with proper directory navigation
- **TypeScript Compilation**: ✅ All errors resolved, builds successfully
- **Docker/Nixpacks**: ✅ Deployment pipeline working
- **Code Versioning**: ✅ Version tracking in place for deployment verification
- **Server Running**: ✅ Application deployed and running on production

### Known Issues
1. **MemoryStore Warning**: ⚠️ Warning appears in logs but PostgreSQL store is initialized (may be false positive)
2. **Session Store Timing**: PostgreSQL store initialized correctly, but warning appears before initialization message

### Next Priority Tasks
1. **Test Authentication Flow**: Verify register → login → protected routes → logout works end-to-end
2. **Fix MemoryStore Warning**: Investigate why warning appears despite PostgreSQL store being set (if it's a real issue)
3. **Implement Event/Client CRUD**: Choose one entity (Events or Clients) and implement full CRUD operations
4. **Frontend Integration**: Connect remaining frontend pages to API endpoints
5. **Error Handling**: Enhance error messages and user feedback

## Known Issues

### Technical Issues
- **MemoryStore Warning**: Warning appears in production logs despite PostgreSQL store being initialized
  - Store is correctly initialized before middleware configuration
  - May be a false positive from express-session
  - Needs verification that sessions are actually using PostgreSQL store
- **Environment Configuration**: All environment variables verified and working

### Development Issues
- **No Error Boundaries**: Client needs error boundary components
- **No Loading States**: Need loading indicators for async operations (auth has basic loading)
- **Form Validation**: Client-side validation implemented for auth, needs expansion
- **No Testing**: Unit and integration tests not set up

## Completed This Session

### Authentication Implementation ✅
- [x] **Backend Auth Routes**: Login, register, and /me endpoints fully implemented
- [x] **JWT Token Generation**: Token creation with user ID and role
- [x] **Password Hashing**: bcrypt integration for secure password storage
- [x] **User Model Updates**: Backward-compatible schema handling (name vs first_name/last_name, password vs password_hash)
- [x] **Error Handling**: Enhanced error messages for database issues (connection, missing tables, column mismatches)
- [x] **Frontend API Service**: Axios instance with base URL, token management, and interceptors
- [x] **AuthContext**: Complete authentication state management with login, register, logout
- [x] **Login Page**: Form validation, error handling, and API integration
- [x] **Register Page**: Full form with validation, password strength checks, and API integration
- [x] **Protected Routes**: Route protection with redirect to login for unauthenticated users

### Deployment & Build Fixes ✅
- [x] **Build Script Fixes**: Fixed directory navigation issues in build process
- [x] **TypeScript Compilation**: Enhanced build scripts with better error reporting
- [x] **Code Version Tracking**: Added CODE_VERSION and BUILD_TIMESTAMP for deployment verification
- [x] **Nixpacks Configuration**: Fixed absolute path issues in Docker build
- [x] **Session Store Initialization**: Refactored to wait for DB connection before configuring middleware
- [x] **Trust Proxy**: Correctly configured for reverse proxy (Coolify)
- [x] **CSP Headers**: Fixed Content Security Policy to allow Google Fonts
- [x] **Deployment Verification**: Build process now verifies new code is deployed

### Infrastructure Improvements ✅
- [x] **PostgreSQL Session Store**: Configured connect-pg-simple for production session storage
- [x] **Server Initialization**: Async initialization pattern to ensure DB connection before middleware
- [x] **Error Logging**: Enhanced logging for production debugging
- [x] **Environment Variables**: Proper handling of VITE_ prefixed variables in client

## Current Status
- **Server Compilation**: ✅ All TypeScript errors resolved
- **Build Process**: ✅ Working correctly, verifies code deployment
- **Deployment**: ✅ Application successfully deployed and running
- **Database Connection**: ✅ PostgreSQL connected and working
- **Authentication**: ✅ Backend and frontend fully implemented
- **Session Store**: ✅ PostgreSQL store initialized (warning may be false positive)

## Next Session Goals

### Immediate Next Steps (Priority Order)
1. **Test Authentication Flow**: 
   - Test register → login → protected route access → logout
   - Verify JWT tokens are stored and sent correctly
   - Test error scenarios (invalid credentials, network errors)

2. **Fix MemoryStore Warning** (if needed):
   - Verify sessions are actually using PostgreSQL store
   - If warning is false positive, document it
   - If real issue, investigate express-session initialization timing

3. **Implement First Entity CRUD** (Choose Events or Clients):
   - Backend: Implement GET all, GET one, POST, PUT, DELETE routes
   - Frontend: Create API service methods
   - Frontend: Update list page to fetch real data
   - Frontend: Create/update forms
   - Test: Full create → read → update → delete flow

4. **Continue with Remaining Entities**:
   - Follow same pattern for Vendors, Payments, Tasks, etc.
   - Reuse established patterns from first entity

5. **Enhance User Experience**:
   - Add loading states for all async operations
   - Improve error messages and user feedback
   - Add form validation where missing
   - Implement error boundaries

### Long-term Goals
- Real-time updates with Socket.io
- File upload functionality
- Reporting and analytics
- Advanced search and filtering
- Email notifications
- Testing suite (unit and integration tests)

---

## Post-Pivot: Event Vendor Client Portal (June 2025)

### Session: Product direction confirmed
- [x] Decided greenfield product model — reuse infra, replace schema and CRM UI
- [x] Confirmed two-sided app: vendor dashboard + client portal
- [x] Confirmed MVP decisions:
  - One login per couple
  - Shared login page with role redirect (VENDOR → `/dashboard`, CLIENT → `/portal`)
  - Invoice display only (no Stripe in MVP)
  - PDF contract + client acknowledgement (no e-sign in MVP)
- [x] Updated Memory Bank: `projectbrief.md`, `productContext.md`, `activeContext.md`, `systemPatterns.md`
- [x] Set placeholder product name: **PortalHub**
- [x] Created `database/schema_portalhub.sql` (drop legacy + create PortalHub tables)
- [x] Created optional `database/seed_portalhub_dev.sql` (test vendor + client)
- [x] Updated User model and register default role to VENDOR
- [x] Schema applied in pgAdmin; legacy `client_event_access` removed
- [x] Documented dev test logins in `techContext.md`
- [x] Rule 7 added: user handles git commits and pgAdmin migrations

### Reusable from pre-pivot work
- [x] Auth backend + frontend (needs role update PLANNER → VENDOR)
- [x] PostgreSQL connection, session store, deploy pipeline
- [x] Express middleware stack, build tooling

### What to build (MVP — in progress)
- [x] New database schema — `database/schema_portalhub.sql` (+ optional `seed_portalhub_dev.sql`)
- [x] Run schema in pgAdmin (user action)
- [x] Auth updates: role redirect, client invite registration, vendor profile on signup
- [x] Minimal `/dashboard` (vendor) and `/portal` (client) shells
- [x] Vendor project CRUD + invite creation from dashboard
- [x] Client portal: project data, milestones, invoices
- [x] Contract PDF + acknowledgement, deliverables upload
- [ ] Remove/archive legacy CRM pages and models

### Session: Auth implementation
- [x] `GET /api/auth/invite/:token` — validate invite
- [x] `POST /api/auth/register/client` — client signup via invite token
- [x] Role redirect: VENDOR → `/dashboard`, CLIENT → `/portal`
- [x] `AcceptInvite` page at `/invite/:token`
- [x] Vendor register creates `vendor_profiles` row
- [x] Legacy CRM routes moved under `/legacy/*`

### Session: Vendor projects + client portal UI
- [x] `Project` model + vendor CRUD + invite API
- [x] `GET /api/portal/project` — client-scoped project data
- [x] Vendor dashboard: create project, list projects, generate invite link
- [x] Client portal: mobile-first, bottom nav (Home / Documents / Payments / Files)
- [x] Client portal: 3-second test UX — status, next action, timeline, invoices

### Session: Product differentiation — client UX
- [x] Documented competitive positioning vs HoneyBook, 17hats, Tripleseat
- [x] Defined client portal UX principles and target IA in `productContext.md`
- [x] Added "3-second test" to MVP success criteria in `projectbrief.md`

### Post-MVP backlog
- **Monetization / Stripe Billing** — vendor subscriptions; see `monetization.md`
- **Quoting / proposals** — inquiry → quote → email → client accept → convert to project (see `productContext.md`, `activeContext.md`)
- Stripe invoice payment (client-facing; optional platform fee)
- E-signature integration
- Email notifications (invites, reminders, quotes)
- Vendor staff accounts
- Custom subdomain per vendor

8. **Vendor dashboard can be denser** — Vendors tolerate complexity when it saves time; clients do not. **Main focus = vendor process; client = simple surface.**

### Session: Product north star confirmed (June 2026)
- [x] End goal documented: streamline vendor business processes; keep client portal simple and easy
- [x] Asymmetric UX strategy explicit in Memory Bank (activeContext, projectbrief, productContext)
- [x] Quoting workflow aligned as vendor-first feature; client only sees accept/decline when needed

### Session: Invite registration fix (June 2026)
- [x] Guard invite + register when project already has linked client
- [x] Block duplicate invites on seeded Miller Celebration project
- [x] AcceptInvite page shows "Portal already set up" when appropriate

### Session: Contracts + vendor project detail + deliverables (June 2026)
- [x] `Contract` model — vendor PDF upload, client view + acknowledgement
- [x] `Deliverable` model — vendor upload (PDF/images/ZIP), client download
- [x] Vendor project detail page `/dashboard/projects/:id` — overview, status, invite, contract, deliverables, timeline, invoices
- [x] Vendor dashboard simplified to project list with links into detail
- [x] Client portal Documents tab — view PDF, acknowledge contract
- [x] Client portal Files tab — download deliverables
- [x] `Project.findDetailForVendor` — aggregated project detail API
- [x] Invite flow UX copy clarified (login at invite, not at contract)

### What to build (MVP — status)
- [x] New database schema — `database/schema_portalhub.sql` (+ optional `seed_portalhub_dev.sql`)
- [x] Run schema in pgAdmin (user action)
- [x] Auth updates: role redirect, client invite registration, vendor profile on signup
- [x] Vendor dashboard + project detail
- [x] Client portal: project data, milestones, invoices, next-action UX
- [x] Contract PDF + acknowledgement, deliverables upload + download
- [x] Remove/archive legacy CRM pages and models
- [x] Quoting workflow — vendor quotes, public `/quote/:token`, convert to project
- [ ] **Monetization plan finalized** — complete checklist in `monetization.md` before launch

### Session: Legacy CRM cleanup (June 2026)
- [x] Removed `/legacy/*` routes and 13 placeholder CRM pages from client
- [x] Removed stub API routes: events, vendors, payments, tasks, clients, reports, upload, users
- [x] Removed unused models: Event, Vendor (supplier), Payment, Activity
- [x] Updated admin Layout for `/admin` nav only (PortalHub branding)
- [x] Updated `database/README.md` + `database/archive/legacy-crm/README.md`
- [x] Active API surface: `/api/auth`, `/api/vendor/projects`, `/api/vendor/quotes`, `/api/quotes`, `/api/portal`

### Session: Monetization planning doc (June 2026)
- [x] Created `monetization.md` — decision checklist, tier hypothesis, build order vs billing
- [x] Cross-linked from activeContext, projectbrief, productContext, progress
- [ ] Dedicated session to fill in pricing decisions before launch

### Session: Competitive pain points research (June 2026)
- [x] User research report added (repo root): HoneyBook, 17hats, Tripleseat, Dubsado, Aisle Planner
- [x] Created `competitivePainPoints.md` — pain point → PortalHub response matrix + roadmap mapping
- [x] Updated productContext competitive table, projectbrief success criteria, activeContext north star
- [x] Key takeaway: link-first flows + mobile web portal + 30-second findability + 2-click pay (post-MVP)

### Session: Quoting workflow (June 2026)
- [x] `database/schema_quotes_addition.sql` — quotes + quote_line_items tables
- [x] Server: Quote model, `/api/vendor/quotes`, public `/api/quotes/:token`
- [x] Client: `/dashboard/quotes`, quote detail, `/quote/:token` accept/decline page
- [x] Flow: create quote → mailto/copy link → client accepts → convert to project → invite flow
- [x] Save as PDF (MVP): browser print on vendor quote detail + public quote page; server-generated PDF later
- [ ] User runs SQL in pgAdmin before testing

### Session: Payments Phase 3a–3c (June 2026)
- [x] `database/schema_payments_addition.sql` — vendor_payment_settings + invoice payment columns
- [x] **3a** — Invoice model + vendor CRUD on project detail (create draft, send, mark paid, delete)
- [x] **3b** — `/dashboard/payments` — Stripe Connect onboarding + P2P handle settings
- [x] **3c** — Client Payments tab: Stripe Checkout, P2P display, "I've sent payment", success banner on Home
- [x] Webhook route `/api/webhooks/stripe` for checkout.session.completed
- [x] User applied `schema_payments_addition.sql` in pgAdmin
- [ ] Stripe test keys + webhook configured for end-to-end card pay test

### Session: Payments UX polish (June 2026 — same day)
- [x] Invoice form labels on vendor project detail (Title, Amount, Due date, etc.)
- [x] P2P clickable links — `p2pPaymentLinks.ts` (Venmo, Cash App, PayPal); Zelle copy-only
- [x] Client Payments — full-width Pay with card / Open Venmo / I've sent payment buttons
- [x] Client redirect to **Home** after payment reported or vendor marks paid (8s poll on Payments tab)
- [x] Prominent green paid card + Home success banners (mirror contract post-sign UX)
- [x] Product decision: vendor payment setup should move into **signup onboarding** (P2P + optional Stripe)

### Next up: Vendor onboarding + payment at signup
- [x] Post-register wizard `/dashboard/onboarding` — business name + P2P + optional Stripe
- [x] `VendorOnboardingGate` — redirects incomplete vendors to onboarding
- [x] Dashboard checklist (payments → project → invite → invoice)
- [x] Invoice send guard (API + UI) when no payment methods
- [x] SQL `schema_vendor_onboarding.sql` — `payment_setup_complete` flag
- [ ] User runs onboarding SQL in pgAdmin
- [ ] E2E test new vendor registration flow
- [ ] Phase 3e: PortalHub vendor subscription (Stripe Billing) — separate from client→vendor pay

### Session: Quote client-agreement UX + contract attachment (June 2026)
- [x] Industry-practice notice on vendor quotes list/detail + public quote page — not a client until: accept quote, sign contract/T&C, pay deposit
- [x] Optional contract PDF attachment when creating a quote (checkbox + title + file)
- [x] Public quote link shows **View contract PDF** when attached
- [x] Convert quote → project copies attached contract into project `contracts` table
- [x] SQL `schema_quote_contract_addition.sql` — `quote_contracts` table
- [ ] User runs quote contract SQL in pgAdmin

### Session: Quote contract view-only → sign after accept (June 2026)
- [x] Contract view-only on public quote link until quote accepted
- [x] After accept: e-sign unlocks on same quote link (no portal login required)
- [x] After sign: deposit pending notice — not a client until deposit paid; vendor sends invoice
- [x] Quote → project conversion copies contract signature to project contract
- [x] SQL `schema_quote_contract_signing.sql`
- [ ] User runs signing SQL in pgAdmin

### Session: Event-first language + project overview edit (June 2026)
- [x] Replaced user-facing "wedding" copy with "event" across portal UI, quotes, invites, login/register
- [x] API field renamed `weddingDate` → `eventDate` (DB column `wedding_date` unchanged — no migration)
- [x] Vendor project detail — **Edit overview** for client name, email, event date, location, description, internal notes
- [x] Dev seed updated (Miller Celebration sample project)

### Session: Neutral event language sweep (June 2026)
- [x] Removed remaining default "wedding" / "couple" copy from app UI and API field names
- [x] `coupleDisplayName` → `clientDisplayName` in API (DB `couple_display_name` unchanged)
- [x] Project titles remain vendor-defined — system copy uses generic "event" / "client" language

---

## End of session — June 17, 2026

**Stopped here.** Code complete for quote/contract industry flow + event-neutral language + project overview edit. User to run SQL before testing new quote-contract features.

### Shipped today (code)
- Quote client-agreement notices (3-part client relationship)
- Optional contract PDF on quote create
- Quote contract: view-only → sign after accept → deposit pending notice
- Quote → project: contract + signature copy
- Event-neutral UI; API `eventDate` + `clientDisplayName`
- Vendor project detail: Edit overview (client contact, event date, etc.)

### User actions before next session
- [ ] Run `005_schema_vendor_onboarding.sql`
- [ ] Run `006_schema_quote_contract_addition.sql`
- [ ] Run `007_schema_quote_contract_signing.sql`
- [ ] Confirm `002_schema_quotes_addition.sql` + `003_schema_contract_ack_enhancement.sql` applied

### Next session priorities
1. Run pending SQL → E2E quote+contract+project path
2. E2E payments path (optional Stripe dev keys)
3. Stripe Connect OAuth (“link existing account”) — discussed, not built
4. Onboarding polish (pre-fill business name from register)
5. Phase 3e vendor subscription billing

---

## June 17, 2026 (continued)

- [x] Moved dev reset/seed SQL into `database/reset/` with local README
- [x] Renumbered schema migrations `001`–`007` in `database/` for ordered pgAdmin runs
- [x] Documented migration naming convention (`NNN_*.sql`, next `008`) in `database/README.md` + Memory Bank
- [x] Added `008_project_payment_settings.sql` for project payment setup + invoice kind metadata
- [x] Implemented guided invoice workflow on project detail: payment setup, deposit/final presets, payment summary
- [x] Client portal payment labels and next action now distinguish deposits from generic invoices
- [x] Added focused tests for payment summary logic (`server`) and deposit portal behavior (`client`)

### Session: Vendor calendar views (June 2026)
- [x] `GET /api/vendor/calendar` — aggregates booked projects + tentative quotes into calendar events + `busyDates`
- [x] Derived availability rules: open = no scheduled project (non-cancelled) and no tentative quote on that date
- [x] `/dashboard/calendar` — month/agenda view (react-big-calendar), upcoming list, click-through to project/quote
- [x] Quote create form — `VendorEventDatePicker` highlights busy days + soft warning (react-calendar)
- [x] Shared `VendorDashboardHeader` nav includes Calendar across vendor pages
- [x] Unit tests: `server/src/utils/vendorCalendar.test.ts`
- [ ] **Later:** Vendor calendar personal entries — notes/reminders/blocks on days (`010_vendor_calendar_entries.sql`; see `activeContext.md`)

### Session: E2E prep + calendar roadmap (June 2026)
- [x] User applied migrations `008` + `009` and committed prior polish work
- [x] Confirmed current calendar is **read-only** (derived from projects/quotes only)
- [x] User wants **personal calendar entries** (payments due, off-book obligations, notes) — documented as **Phase 2 / migration `010`**, not MVP blocker
- [x] **Fix:** Quote contract PDF not attaching — removed broken `Content-Type: multipart/form-data` header (missing boundary); FormData interceptor in `api.ts`; relaxed PDF mime filter; rollback quote if attach fails
- [ ] User E2E test: new vendor full path (re-create quote with contract to verify fix)

### Session: Vendor product polish priorities 1–5 (June 2026)
- [x] P1 — Vendor command center: `GET /api/vendor/dashboard`, attention queue, stats, upcoming events, refreshed home UI
- [x] P2 — Notifications: `009_vendor_notifications.sql`, bell dropdown, Socket.io push, hooks on quote/invite/payment events
- [x] P3 — Transactional email: nodemailer service; send quote / invite / invoice when SMTP configured; UI send buttons
- [x] P4 — Pipeline steppers on quote detail and project detail
- [x] P5 — `/dashboard/settings` branding page, logo upload, branded vendor header with accent colors
- [x] User ran `008` + `009` SQL in pgAdmin

### Session: Product rebrand to SmoothGig (June 20, 2026)
- [x] Evaluated **Gigly** — rejected (gigly.com taken); user chose **SmoothGig** (`smoothgig.com` available)
- [x] `client/src/constants/branding.ts` — `APP_NAME`, `APP_NAME_PARTS`, tagline, domain
- [x] `client/src/components/branding/AppName.tsx` — wordmark split **Smooth** + **Gig** (accent on second half)
- [x] Login, Register, onboarding, admin Layout, vendor header fallback use `AppName`
- [x] `index.html` meta/title; server startup log
- [x] Memory Bank updated for handoff
- [x] User committed rebrand + polish work
- [ ] User: register domain, favicon/logo

### Session: Remove deliverables feature (June 21, 2026)
- [x] Product decision: vendors share photos/galleries externally (Pixieset, Drive, etc.)
- [x] Removed Files tab, vendor upload UI, deliverable API routes
- [x] Kept contract PDF on Documents tab with view/download after sign
- [x] User dropped `deliverables` table in pgAdmin (`010_drop_deliverables.sql` added to repo for other envs)
- [ ] User commit + deploy when ready

### Session: US date format app-wide (June 20, 2026)
- [x] `formatUsDate()` + `formatUsDateTime()` in `calendarHelpers.ts`
- [x] Replaced all client `toLocaleDateString` usage — quotes, portal, projects, calendar, notifications
- [x] `formatEventDate()` / `formatCalendarDate()` use shared MM-DD-YYYY formatter
- [x] User committed: "Implement app-wide US date format"

### Session: Quote reliability + production fixes (June 20, 2026)
- [x] Quote contract PDF attach fix (FormData Content-Type, mime filter, rollback on failure)
- [x] `POST /api/vendor/quotes/:id/contract` re-upload endpoint + vendor UI
- [x] CSP / iframe fix — API URLs instead of blob URLs; helmet `frameSrc`
- [x] Mobile-responsive `QuoteDocument` line items
- [x] Documented Coolify volume requirement for `/app/server/uploads`
- [ ] Deploy to production + verify PDF survives redeploy

### Session: Quote US date format (June 20, 2026) — superseded by app-wide pass
- [x] Initial `formatUsDateKey()` in quote document + vendor quotes list

### Session: Product name — Gigly rejected (June 2026)
- [x] Considered **Gigly** — rejected because gigly.com is taken
- [x] Reverted UI/Memory Bank to **PortalHub** placeholder; `client/src/constants/branding.ts` is the single swap point for the next name

### Session: Product rebrand to Gigly (June 2026) — superseded
- ~~Official product name: Gigly~~ — reverted (domain unavailable)

---

## End of session — June 20, 2026

**Stopped here.** User committed US date format. Quote-contract and CSP fixes are in codebase; confirm deploy + volume before production E2E.

### Shipped this session (code)
- App-wide **MM-DD-YYYY** date display (`formatUsDate`, `formatUsDateTime`)
- Quote contract upload reliability + re-upload API/UI
- CSP-safe contract PDF iframes
- Mobile quote document layout

### User actions before next session
- [ ] Deploy latest to production (client + server)
- [ ] Confirm uploads volume mounted at `/app/server/uploads`
- [ ] Re-upload any missing quote contract PDFs
- [ ] Confirm migrations `002`–`007` if needed

### Next session priorities
1. Production smoke (dates, quote PDF iframe, contract after redeploy)
2. E2E — new vendor: quote + contract → accept → sign → convert → invite → portal
3. E2E — payments: deposit invoice, P2P, optional Stripe
4. Stripe Connect OAuth vs Express — decide
5. Register smoothgig.com + favicon/logo
6. Phase 3e vendor subscription (pre-launch)
7. Calendar personal entries — migration `011` (deferred)

### Session: Deliverables removal + client portal branding (June 20, 2026)
- [x] Removed deliverables feature (vendor upload, client Files tab, API routes, model queries)
- [x] Client portal tabs: Home / Documents / Payments only
- [x] Signed contract PDF view on Documents tab
- [x] `database/010_drop_deliverables.sql` for other environments
- [x] Client portal branded header — logo, business name, tagline, accent bar (`ClientPortalHeader.tsx`)
- [x] Portal API returns `vendorTagline` from `vendor_profiles.tagline`
- [x] Home card no longer duplicates vendor name (project title focus)
- [x] Project contract re-upload when PDF missing on disk (`fileAvailable`, vendor UI + API replace)

---

## End of session — June 21, 2026 (evening)

**Stopped here.** Portal contract sign/view verified on production. Family UAT guide ready to send.

### Shipped this session (code — user to commit when ready)
- Client portal **branded header** (`ClientPortalHeader`, `vendorTagline` API)
- **Project contract re-upload** (`Contract.replaceFile`, `fileAvailable`, vendor UI)
- **Portal contract iframe auth** — `access_token` query on GET; `ContractSignPanel` + `auth.ts`
- Portal **404** when contract file missing on disk
- **`docs/family-uat-guide.md`** for family testers

### Production lessons logged
- Mount uploads at **`/app/server/uploads`**; missing `contracts/` folder = re-upload or SQL delete + fresh upload on old server
- Blob iframe URLs blocked by **`frame-src 'self'`** — do not use for portal contracts
- Iframe cannot send Bearer token — query param or cookie required

### User actions before next session
- [ ] Commit pending changes
- [ ] Email family UAT guide with filled logins + quote/invite links
- [ ] Collect UAT feedback (mobile client portal priority)
- [ ] Optional: redeploy volume persistence test on `contracts/6/*.pdf`

### Next session priorities
1. Family UAT feedback → fixes
2. Payments E2E (deposit, P2P, Stripe)
3. Volume survives redeploy confirmation
4. Stripe Connect OAuth decision
5. Register smoothgig.com + launch polish

### Session: Portal contracts + prod fixes + UAT doc (June 21, 2026 — evening)
- [x] Diagnosed missing contract PDFs on disk (`ENOENT`); volume at `/app/server/uploads` confirmed
- [x] Project contract **re-upload/replace** API + vendor UI (`fileAvailable`)
- [x] Portal contract iframe: **`access_token` query** auth (rejected blob URL due to CSP)
- [x] User verified client portal contract flow on production after redeploy + re-upload
- [x] **`docs/family-uat-guide.md`** for wife/MIL testing on live site
- [ ] Family UAT execution + feedback triage
- [ ] User commit when ready
