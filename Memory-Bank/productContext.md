# Product Context: PortalHub (placeholder)

> **Platform name:** **PortalHub** — temporary working title for the vendor/client portal product.

## End Goal

**Streamline vendor business processes while keeping the client experience simple and easy to use.**

- **Vendor dashboard** = where the product earns its keep: quotes, projects, clients, money, files, status — wired together so vendors spend less time in email, spreadsheets, and disconnected tools.
- **Client portal** = thin, branded window into *their* wedding with that vendor — never a second CRM.

When trade-offs arise, **default to vendor workflow efficiency** on the dashboard and **ruthless simplicity** on the portal.

## Why This Project Exists

### Problem Statement
Wedding vendors and their clients lose time and trust when project work is scattered:
- **Email threads** for status updates and document sharing
- **Google Drive / Dropbox** for deliverables with no tie to project status
- **Separate invoicing tools** disconnected from the client relationship
- **Contracts** sent as attachments with no clear acknowledgement trail
- **No single branded hub** where the couple sees everything for their wedding with that vendor

### Target Users
| User | Description |
|------|-------------|
| **Vendor** | Freelancer or small wedding business (photographer, florist, DJ, videographer, etc.) |
| **Client (Couple)** | The hiring party — one shared login per couple |
| **Platform Admin** | Optional; for platform operator, not MVP focus |

## How It Should Work

### Authentication Flow
1. User visits shared `/login`
2. Credentials validated; role read from account
3. Redirect:
   - `VENDOR` → `/dashboard`
   - `CLIENT` → `/portal`
4. Registration paths differ: vendor self-registers; client registers via vendor invite link

### Vendor User Flows

**Onboarding**
- Register as vendor
- Set business name and basic portal branding

**Project management**
- Create project (title, wedding date, location, notes)
- Set project status (e.g. inquiry, booked, in progress, delivered, complete)
- Add milestones — mark which are visible to client

**Client management**
- Add couple name and email to project
- Send invite link — client has no account yet; the link is their sign-up (not `/register` or `/login` first)
- Client opens `/invite/{token}` → sets password → linked to project → future visits use `/login`

**Contracts**
- Upload contract PDF to project
- Client views and acknowledges; timestamp stored

**Invoices**
- Create invoice (amount, description, due date, status)
- Client views in portal (no online payment in MVP)

**Deliverables**
- Upload files; client downloads from portal

### Client User Flows

**Onboarding**
- Receive invite email/link from vendor
- Register (one account per couple)
- Land in branded portal for their project

**Portal experience**
- See project overview: wedding date, current status, milestone timeline
- View and acknowledge contract PDF
- View invoices and payment status (display only)
- Download deliverables
- Portal styled with vendor branding (logo, colors, business name)

### User Experience Goals
- **Vendor dashboard**: **Primary product focus** — streamline business processes (inquiry → quote → project → contract → invoice → delivery); efficient, connected workflows; density acceptable if it saves steps
- **Client portal**: **Non-negotiable simplicity** — dead simple, calm, obvious; couples should never feel lost
- **Asymmetric investment**: Build depth for vendors; expose only client-facing outcomes on the portal
- **Trust**: Clear status, no hunting through email
- **Mobile responsive**: Client portal mobile-first; vendor dashboard desktop-friendly with mobile usable
- **Secure isolation**: Clients never see other projects or vendors

## Competitive Positioning

### Market gap
Tools like **HoneyBook**, **17hats**, **Tripleseat**, and similar platforms are powerful but often criticized for:
- Cluttered interfaces and too many clicks to find basic info
- Client-facing views that feel like an afterthought (vendor CRM first, couple experience second)
- Overwhelming settings, modules, and terminology aimed at power users
- Poor mobile experience for clients checking status on the go

### PortalHub differentiation
**Win on two fronts:** (1) **vendor workflow** — one streamlined path from lead to delivery; (2) **client UX** — the clearest, easiest portal in the category.

| Competitor weakness | PortalHub response |
|--------------------|-------------------|
| Vendor tools scattered / too many apps | Unified vendor dashboard: quote → project → contract → invoice → files |
| Client portal buried / confusing | One project, one screen hub — status + next action always visible |
| Too many tabs and menus | Client sees 3–4 clear sections max: Overview, Documents, Payments, Files |
| Generic, corporate feel | Vendor-branded, warm, wedding-appropriate tone |
| Desktop-first client views | Mobile-first client portal layout |
| Jargon ("workflows", "pipelines") | Plain language: "Your wedding", "What's next", "Sign contract", "View invoice" |

### Client portal UX principles (design north star)
1. **One glance clarity** — Within 3 seconds, the couple knows: wedding date, current status, and the single most important next step
2. **Progressive disclosure** — Show summary first; details on tap/click — never dump everything on one page
3. **Obvious next action** — One primary CTA per visit (e.g. "Review contract", "View invoice") — not a wall of equal buttons
4. **Plain language** — No CRM jargon on the client side; write for stressed couples, not event planners
5. **Mobile first** — Design client portal for phone, then scale up to desktop
6. **Calm visual hierarchy** — Generous whitespace, limited color palette (vendor accent + neutrals), large readable type
7. **Zero training** — If a couple needs instructions to use the portal, the design failed
8. **Vendor dashboard can be denser** — Vendors tolerate complexity; clients do not. Asymmetric UX investment favors the portal

### Client portal information architecture (target)
```
/portal
├── Home (overview + next action + timeline snippet)
├── Documents (contracts — sign/acknowledge)
├── Payments (invoices — view status)
└── Files (deliverables — download)
```
No sidebar with 12 items. No settings the client doesn't need. Optional vendor message/notes on home only.

### What we intentionally avoid (client side)
- Multi-project dashboards for couples (MVP: one project — even simpler)
- Feature parity with vendor dashboard exposed to clients
- Nested menus, hamburger-with-everything navigation
- Empty states without guidance ("No data" → "Sam will upload your contract soon")
- Modal overload and multi-step wizards for simple tasks

## Key Features

### MVP
- Shared login with role redirect
- Vendor dashboard (projects, clients, settings)
- Client portal (project view, contracts, invoices, deliverables)
- Project-scoped authorization
- Vendor branding on client portal
- PDF contract acknowledgement
- Invoice display

### Post-MVP
- **Quoting / proposals** — pre-project sales: inquiry → quote → email → client accept → convert to project (priority feature for next phase)
- Stripe (or similar) invoice payment
- E-signature for contracts
- Email notifications (invite, invoice, deliverable ready, quote sent)
- Vendor staff accounts
- Custom subdomain per vendor (`smithphoto.app.com`)
- Questionnaires (shot list, timeline)
- Photo gallery delivery UX

## Quoting Workflow (Planned — June 2026)

Extends PortalHub **upstream** of the current project lifecycle so vendors can win new business in the same tool.

### Intended flow
1. **Inquiry** — couple asks about services (captured in-app or vendor enters manually)
2. **Quote** — vendor builds quote (services, line items, total, optional notes/PDF)
3. **Send** — vendor emails quote link to client (mailto MVP or integrated email later)
4. **Accept** — client opens link, reviews quote, accepts (or declines)
5. **Convert** — vendor creates/confirms project from accepted quote
6. **Existing portal flow** — invite client → contract → invoice → deliverables

### Design notes
- Reuse patterns from **invite tokens** for quote acceptance links (public URL, no account required until later if desired)
- Quote acceptance should **not** require portal login; acceptance is a sales step, portal login remains at invite
- After conversion, quote links to `projects.id`; project status likely starts at `inquiry` or `booked`
- Competitive angle: simpler quote-to-portal handoff than bloated CRM suites

### Out of scope for quoting v1 (TBD next session)
- Payment collection on quote accept
- Multi-version quote revisions
- Automated inquiry forms on vendor websites
