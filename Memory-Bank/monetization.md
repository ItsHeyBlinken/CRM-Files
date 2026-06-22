# Monetization Plan: SmoothGig

> **Status:** ✅ **Confirmed by owner (June 2026).** Implement via Stripe Billing (Phase 3e) after product validation.  
> Paying customer: **event vendor only**. Clients never pay SmoothGig.

---

## One-sentence pricing story (for landing page)

**Start free with one active gig. Upgrade to Pro for unlimited bookings — one flat subscription, no platform fees on your client payments. Card processing is Stripe’s standard rate only if you connect Stripe.**

---

## Confirmed model: Freemium + Pro

| | **Starter (Free)** | **Pro** |
|---|-------------------|---------|
| **Price** | $0 | See **Pro pricing** below |
| **Active projects** | 1 at a time | Unlimited |
| **Quotes** | 3 per month | Unlimited |
| **Client portal** | ✅ Full (1 project) | ✅ Unlimited clients |
| **Contracts + e-sign** | ✅ | ✅ |
| **Invoices + P2P / Stripe Connect** | ✅ | ✅ |
| **Branding** (logo, colors, tagline) | ✅ | ✅ |
| **Calendar, notifications, email** | ✅ | ✅ |
| **Team seats** | 1 (owner) | 1 (multi-seat = future tier) |

---

## Pro pricing (confirmed)

| Cohort | Monthly | Annual | Notes |
|--------|---------|--------|-------|
| **Founding Pro** (first **50** paid subscribers) | **$19/mo** | **$199/yr** | Price **locked for life** while subscription stays active |
| **Pro** (subscriber **51+**) | **$29/mo** | **$299/yr** | Standard list price |

### Founding Pro rules

- **Cap:** First **50** vendors who subscribe to a paid Pro plan (monthly or annual).
- **Grandfathering:** Founding rate applies **as long as they remain a continuous subscriber**. If they cancel and resubscribe later, they pay current list price unless you grant an exception manually.
- **Implementation note:** Persist `plan_tier: founding_pro | pro` and `stripe_price_id` on the vendor/subscription record at signup — do not migrate founding users to new prices on Stripe price updates.
- **Counter:** Track `founding_pro_slots_remaining` (or count paid subs with `founding_pro`) in admin or DB; close founding checkout when count hits 50.

Annual savings vs monthly: Founding ~$29/yr off; Standard ~$49/yr off.

---

## Payment fees — confirmed policy

| Fee type | Who pays | Amount |
|----------|----------|--------|
| **SmoothGig subscription** | Vendor | $19–29/mo or annual equivalent (above) |
| **SmoothGig platform fee on client payments** | — | **None — ever** |
| **Stripe card processing** (optional Connect) | Vendor (via Stripe) | **Standard Stripe transaction fees only** when vendor links Stripe and client pays by card |
| **P2P** (Venmo, Zelle, etc.) | — | No SmoothGig fee; no Stripe fee |

**Messaging:** “We don’t take a cut of your client payments. If you use Stripe for card pay, you pay Stripe’s processing fee — not an extra SmoothGig fee.”

**Product implication:** Stripe Connect must use **direct charges** or equivalent where application fees are **not** applied. Subscription revenue is **Stripe Billing only**.

---

## Upgrade triggers (Starter → Pro)

1. **Second simultaneous active project**
2. **4th quote in a calendar month**
3. Soft nudge after first client portal login (optional)

Do **not** block clients on existing Starter projects when vendor hits limits — grandfather active client relationships.

---

## Trial strategy (confirmed)

- **Freemium Starter** — primary path; no credit card at vendor signup
- Card collected **only at Pro upgrade**
- No mandatory 14-day trial (defer unless needed)

---

## Competitive positioning

| Competitor | Typical solo SaaS | SmoothGig |
|------------|-------------------|-----------|
| HoneyBook / 17hats / Dubsado | ~$20–40/mo + often transaction fees | **$29/mo, zero platform fees**, simpler workflow |
| Founding offer | — | **$19/mo locked** for first 50 — strong early-adopter hook |

---

## Value ladder → subscription hooks

```
Quote               →  Win the job        →  Starter: 3/mo cap
Project + invite    →  Onboard client    →  Starter: 1 active project
Contract + sign     →  Professionalism   →  Included all tiers
Invoice + pay       →  Get paid          →  Included; 0% SmoothGig fee
Branded portal      →  Your brand        →  Included all tiers
```

---

## Decision checklist — locked

| # | Question | **Decision** |
|---|----------|--------------|
| 1 | Who pays SmoothGig? | **Vendor subscription only** |
| 2 | Platform fee on client payments? | **No — permanent** |
| 3 | Stripe card fees? | **Stripe standard only** (vendor’s Connect account) |
| 4 | Pricing model | **Freemium Starter + Pro** |
| 5 | Free tier | **Yes** — 1 active project, 3 quotes/mo |
| 6 | Founding Pro | **$19/mo, $199/yr** — first **50** subs, **lifetime lock** while active |
| 7 | Standard Pro | **$29/mo, $299/yr** — after founding cap |
| 8 | Billing processor | **Stripe Billing** (subscriptions) |
| 9 | Annual plans | **Yes** at launch |

---

## Build order vs billing

| Phase | Work |
|-------|------|
| **Now** | Landing pricing section (copy below); family UAT |
| **Pre-launch** | ToS, privacy, refund policy |
| **Launch prep** | Stripe Billing products/prices (4 price IDs: founding monthly/annual, standard monthly/annual), `vendor_profiles.plan`, founding counter, upgrade UI, webhooks |
| **Post-launch** | Conversion metrics, founding cap monitoring |

**Schema prep:** `plan` (`starter` \| `pro`), `plan_tier` (`founding_pro` \| `standard`), `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, `founding_pro_locked_at`.

**Stripe Connect:** No `application_fee_amount` on Checkout Sessions for client invoice pay.

---

## Landing page pricing copy (ready to use)

### Starter — Free
One active project, 3 quotes per month, full branded client portal, contracts, and invoices.

### Founding Pro — $19/mo or $199/yr *(first 50 vendors)*
Unlimited projects and quotes. **Your rate stays $19/mo (or $199/yr) for as long as you subscribe.**  
After 50 founding spots, Pro is $29/mo.

### Pro — $29/mo or $299/yr
Everything in Starter, unlimited — for vendors booking multiple gigs.

**Fine print (footer):** Clients never pay SmoothGig. SmoothGig charges **no platform fee** on client payments. Card payments use your connected Stripe account at **Stripe’s standard processing rates** only.

---

## Open items (remaining)

- [ ] Starter limit tweak: keep 3 quotes/mo or unlimited quotes on free tier?
- [ ] Legal: ToS, privacy, refund policy before first charge
- [ ] Admin view: founding slots remaining (50 − count)
- [ ] Implement Stripe Billing (Phase 3e)
- [x] Add pricing section to `/` landing page

---

## Related docs

- `projectbrief.md` — business model summary
- `activeContext.md` — Payment architecture (two money flows)
- `competitivePainPoints.md` — fee transparency vs HoneyBook
