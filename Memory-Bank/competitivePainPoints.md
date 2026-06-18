# Competitive Pain Points Research

> **Source document:** [`Wedding Vendor_Client Web App_ Pain Points Research Report.md`](../Wedding%20Vendor_Client%20Web%20App_%20Pain%20Points%20Research%20Report.md) (repo root)  
> **Platforms analyzed:** HoneyBook, 17hats, Tripleseat, Dubsado, Aisle Planner  
> **Research focus:** Client-side usability, communication reliability, mobile access

This file turns research into **product requirements** for PortalHub. When building a feature, check whether it addresses a listed pain point.

---

## Shared market pain points (priority targets)

These recur across competitors and should drive PortalHub design.

| Pain point | What users hate | PortalHub response | Status |
|------------|-----------------|-------------------|--------|
| **Email deliverability** | Platform emails hit spam; clients miss invites, quotes, contracts | Prefer **direct links** clients open in browser; post-MVP: reputable transactional email (Postmark/Resend) + SPF/DKIM guidance for vendors | MVP: mailto + copy link; post-MVP: send API |
| **Mobile access** | Clunky portals, limited native apps, desktop-first UX | **Mobile-first client portal** in browser — no app download required | ✅ Built |
| **Finding info quickly** | Can't find milestones, contracts, invoices within ~30 seconds | **3-second test**: status + **one next action** on Home; 4 tabs max (Home, Documents, Payments, Files) | ✅ Built |
| **Payment friction** | Too many clicks; complex login just to pay | Design Payments tab for **2-click pay** when Stripe ships; MVP shows invoice clearly with obvious future pay CTA | MVP: display only; post-MVP: Stripe |
| **Communication fragmentation** | Clients fall back to text/email when portal fails | Single **branded hub** for status, docs, invoices, files; vendor pushes one portal link after booking | ✅ Direction set |
| **Overwhelming complexity** | Tools feel like overkill vs Google Sheets/email | **Asymmetric UX**: rich vendor dashboard, **minimal client surface**; no CRM jargon on client side | ✅ North star |
| **Slow / buggy UX** | Slow loads, glitches, unreliable automation | Lean client bundle; **minimal client-side automation**; test on real phones | Ongoing |
| **Multi-email chaos** | Separate emails per contract/document | **One project, one portal** — contract, invoices, deliverables in one place | ✅ Built |
| **Vendor setup burden** | Hours configuring Dubsado-like systems | Sensible defaults: create project → invite → upload; **quote → accept → project** in minutes; branding optional | ✅ Quoting shipped |

---

## Pain points by competitor → our counter-move

### HoneyBook
| Issue | PortalHub counter |
|-------|-------------------|
| Slow performance | Fast Vite SPA; avoid heavy client dashboard on phone |
| Email glitches (truncated text) | Don't rely on rich HTML platform email for critical actions — use in-app pages |
| Transaction fees | Transparent pricing in `monetization.md`; avoid hidden client-side fees |
| Refund delays | Out of scope until we process payments; if we add Stripe, clear refund SLA |

### 17hats
| Issue | PortalHub counter |
|-------|-------------------|
| Clunky, outdated client UI | Modern Tailwind, large type, calm layout |
| Buggy automation | Ship fewer, reliable flows over complex automation |
| Limited mobile app | **Mobile web** beats bad native app — optimize portal for Safari/Chrome mobile |
| Low clarity / visibility | Next-action CTA + plain language status labels |

### Tripleseat
| Issue | PortalHub counter |
|-------|-------------------|
| Emails → spam | Link-based flows (`/invite`, `/quote`); educate vendors to whitelist; transactional email post-MVP |
| Multiple emails per booking | Single portal per project |
| Clients contact vendor outside platform | Make portal faster than email for contract, invoice, files |

### Dubsado
| Issue | PortalHub counter |
|-------|-------------------|
| Steep vendor learning curve | Opinionated defaults; no infinite customization MVP |
| Time-consuming portal setup | Project + invite in minutes; branding is optional polish |
| Poor mobile (legacy) | Mobile-first client portal from day one |

### Aisle Planner
| Issue | PortalHub counter |
|-------|-------------------|
| Overkill for simple weddings | Solo-vendor scope; no enterprise planner complexity |
| Feels worse than Sheets/Drive | Must beat email+Drive on **clarity and next step**, not feature count |

---

## Feature roadmap mapped to pain points

| Planned work | Pain points addressed |
|--------------|----------------------|
| **Quoting** (`/quote/:token`) | Email fragmentation; vendor setup; pre-booking clarity | ✅ Built (print-to-PDF MVP; downloadable PDF post-MVP) |
| **Invite flow** (`/invite/:token`) | Email deliverability (link works even if email is missed if vendor texts link) |
| **Client portal Home + next action** | 30-second findability; clarity |
| **Single contract + deliverables in portal** | Multi-email chaos |
| **Stripe invoice pay (post-MVP)** | Payment friction (target: 2 taps) |
| **Transactional email (post-MVP)** | Deliverability; HoneyBook/Tripleseat email issues |
| **In-app vendor→client message (post-MVP?)** | Communication fragmentation — only if simpler than email |

---

## Design constraints from research (non-negotiable)

1. **Client portal works in mobile browser** — no required app install
2. **Critical actions have a URL** — invite, quote accept, contract view (not email-only)
3. **Home answers:** What's my status? What do I do next?
4. **Vendor setup < 15 minutes** to first client invite (after account creation)
5. **Avoid** exposing vendor CRM complexity to clients
6. **Avoid** multiple outbound emails for one booking when one portal link suffices

---

## Metrics to validate we're winning

- Client finds contract or invoice in **< 30 seconds** (user test)
- Client completes acknowledgement without vendor help (zero-training test)
- Vendor reports fewer "where do I find…?" client emails
- Page load acceptable on 4G mobile (Lighthouse / real device)
- Post-launch: quote/invite link open rate vs email open rate

---

## Related docs

- `productContext.md` — UX principles and competitive positioning
- `projectbrief.md` — success criteria
- `monetization.md` — fee transparency vs HoneyBook
- `activeContext.md` — current build priorities
