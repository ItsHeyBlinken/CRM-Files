# Monetization Plan: SmoothGig

> **Status:** 📋 **Not decided — planning required before launch.**  
> This document captures what to decide, options to evaluate, and how monetization ties to product build order.

## Why this matters

PortalHub is **vendor-first** — the paying customer is the wedding freelancer/vendor, not the couple. A clear monetization plan should:

- Match how solo/small wedding vendors already buy software (monthly SaaS, not enterprise contracts)
- Align with the **value ladder**: quote → project → portal → contract → invoice → deliverables
- Stay simple enough to explain in one sentence on a landing page
- Not undermine the **simple client portal** (clients should never pay PortalHub directly in MVP)

---

## Decisions still needed

Use this checklist when you're ready to lock a plan. Nothing here is final.

| # | Question | Options to consider | Decision |
|---|----------|---------------------|----------|
| 1 | **Who pays?** | Vendor only (recommended) vs vendor + optional client fees | _TBD_ |
| 2 | **Pricing model** | Flat monthly / tiered by active projects / tiered by features / freemium + paid | _TBD_ |
| 3 | **Free tier?** | Yes (limited projects or quotes) vs paid-only from day one | _TBD_ |
| 4 | **Trial** | 14-day full access vs freemium forever vs demo-only | _TBD_ |
| 5 | **Payment processor** | Stripe Billing (subscriptions) — aligns with future invoice payments | _TBD_ |
| 6 | **What is gated?** | Quotes, projects, storage, branding, team seats, etc. | _TBD_ |
| 7 | **Competitive anchor** | HoneyBook / 17hats / Dubsado price bands ($20–50/mo solo) | _TBD_ |
| 8 | **Launch pricing** | Early-adopter discount vs full price from launch | _TBD_ |

---

## Recommended starting hypothesis (validate before building billing)

**Target customer:** Solo wedding vendor (photographer, DJ, florist) doing ~5–30 weddings/year.

**Model to prototype on paper first:**

| Tier | Price (hypothesis) | Includes |
|------|-------------------|----------|
| **Starter** | Free or $0 | 1 active project, basic portal, no quoting (or 1 quote/mo) |
| **Pro** | ~$29–39/mo | Unlimited projects, quoting, contracts, deliverables, branding |
| **Growth** | ~$49–69/mo | Pro + multiple staff (post-MVP) + priority support |

**Principles:**

- **Charge vendors, not couples** — client portal stays free to the end client
- **Gate on business value** — quoting + active projects are natural upgrade triggers (vendor earns money through the tool)
- **Transparent fees** — HoneyBook pain point: surprise transaction fees; state pricing clearly, avoid hidden client-side charges
- **Stripe later** — MVP has no billing; add subscription after quoting + core loop are proven
- **Don't gate client UX** — never paywall "view your contract" for the couple

---

## Value ladder → monetization hooks

Product features map to what vendors will pay for:

```
Inquiry / Quote     →  "Win the job"        →  Strong paid-tier driver
Project + Invite    →  "Onboard client"     →  Core subscription value
Contract + Ack      →  "Look professional"  →  Retention
Invoice display     →  "Get paid clarity"   →  Upsell to Stripe pass-through later
Deliverables        →  "Deliver the goods"  →  Storage limits possible
Branded portal      →  "My brand, not yours"→  Pro tier differentiator
```

Future **transaction revenue** (optional, post-MVP): small % on Stripe invoice payments processed through PortalHub — only if it simplifies vendor life vs standalone Stripe.

---

## Competitive reference (rough — verify at launch)

| Product | Typical solo pricing | Notes |
|---------|---------------------|-------|
| HoneyBook | ~$19–40/mo (promo-dependent) | Full CRM + client portal |
| 17hats | ~$15–50/mo | Similar all-in-one |
| Dubsado | ~$20–40/mo | Strong workflows |
| **PortalHub angle** | Undercut on **simplicity**, not feature count | Win vendors who hate bloated CRMs; win couples on portal UX |

PortalHub should **not** try to match every HoneyBook module on day one. Monetize on **streamlined vendor workflow + best-in-class client portal**.

---

## Build order vs billing

| Phase | Product | Billing |
|-------|---------|---------|
| **Now (MVP)** | Auth, projects, portal, contracts, deliverables | None — validate product |
| **Next** | Quoting workflow | Still none — prove quote → project loop |
| **Pre-launch** | Define tiers + landing page pricing | Write plan in this doc (Decision column filled) |
| **Launch prep** | Stripe Billing, plan limits in DB, upgrade UI | Implement subscription |
| **Post-launch** | Stripe invoice payments for clients | Optional platform fee |

**Do not block MVP on billing.** Do **document** tier limits early so schema doesn't fight subscription gates later (e.g. `vendor_profiles.plan`, `max_active_projects`).

---

## Metrics to track before charging

- Vendor completes: quote → accept → project → invite → client login
- Time from vendor signup to first client on portal
- Churn risk signals: no login 30 days, no projects after signup
- Willingness-to-pay interviews: 5–10 wedding vendors, show prototype, ask price anchor

---

## Open items / reminders

- [ ] Schedule dedicated **monetization planning session** (separate from feature work)
- [ ] Fill in **Decision** column in checklist above
- [ ] Write one-paragraph **positioning statement** for pricing page
- [ ] Decide if **annual billing** discount (e.g. 2 months free) is offered at launch
- [ ] Legal: terms of service, privacy policy, refund policy (before taking money)
- [ ] Revisit after **quoting** ships — quoting is likely the first feature worth gating on paid tier

---

## Related docs

- `projectbrief.md` — product scope and phases
- `productContext.md` — vendor-first strategy and competitive positioning
- `activeContext.md` — current build priorities
