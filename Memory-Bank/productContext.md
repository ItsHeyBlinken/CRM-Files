# Product Context: PortalHub (placeholder)

> **Platform name:** **PortalHub** — temporary working title for the vendor/client portal product.

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
- Send invite; couple creates one shared account

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
- **Vendor dashboard**: Admin-style, efficient, business-focused
- **Client portal**: Simple, calm, branded — couple sees only what matters to them
- **Trust**: Clear status, no hunting through email
- **Mobile responsive**: Couples often check on phone
- **Secure isolation**: Clients never see other projects or vendors

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
- Stripe (or similar) invoice payment
- E-signature for contracts
- Email notifications (invite, invoice, deliverable ready)
- Vendor staff accounts
- Custom subdomain per vendor (`smithphoto.app.com`)
- Questionnaires (shot list, timeline)
- Photo gallery delivery UX
