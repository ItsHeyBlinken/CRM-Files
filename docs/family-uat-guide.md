# SmoothGig — Family User Testing Guide

**Live site:** https://plannercrm.bytesbyblinken.com  

Thank you for helping test **SmoothGig** — software for event vendors (photographers, planners, etc.) and their clients. Your honest feedback on a phone and a laptop is exactly what we need.

---

## Before you send — fill in these placeholders

Replace the bracketed placeholders below, then copy everything **from “Email intro” through “End of guide”** into your email (or a Google Doc link).

| Item | Your value (example) |
|------|----------------------|
| Vendor login email | `[vendor@test.com]` |
| Vendor temp password | `[share securely — not in group email]` |
| Client login email | `[client@test.com]` |
| Client temp password | `[share securely]` |
| Public quote link | `[https://plannercrm.bytesbyblinken.com/quote/TOKEN]` |
| Client portal invite link | `[https://plannercrm.bytesbyblinken.com/invite/TOKEN]` |
| Test event date | `[09-15-2026]` |
| Vendor business name in app | `[Sam Photography]` |

**Suggested split:** One person plays **vendor** (wife or MIL with vendor experience). Another plays **client** (couple receiving the quote/portal). You can run the vendor steps first, then send the client the quote + invite links.

---

## Email intro (copy/paste)

> Hi — I’m testing an app I built for event vendors and their clients (**SmoothGig**). I’d love your eyes on it since you’re in this world.
>
> **Site:** https://plannercrm.bytesbyblinken.com  
>
> There are two roles to try:
> 1. **Vendor** — like running a photography business (quotes, contracts, invoices).  
> 2. **Client** — like a couple viewing their portal on a phone.
>
> Login details and links are below. Please try at least half of this on your **phone** (Safari or Chrome). When something feels confusing, slow, or broken, send me a screenshot and what you were trying to do — that’s gold.
>
> This is early software: no gallery/file downloads in the client portal yet, and email might not send automatically (links are copy-paste for now). Focus on whether the flow **makes sense** and whether a real client would know what to do next without a phone call.
>
> Thanks!

---

## Test personas (use these names so we’re aligned)

| Role | Who | Fake business / couple |
|------|-----|-------------------------|
| Vendor | `[Tester 1 name]` | **Sam Photography** — tagline: *Capturing your day, beautifully.* |
| Client | `[Tester 2 name]` | **Alex & Jordan Miller** — event: `[09-15-2026]` |

---

## Part 1 — Vendor testing (~45 min)

**Login:** https://plannercrm.bytesbyblinken.com/login  
**Email:** `[vendor@test.com]` · **Password:** `[ask the person who sent this guide]`

After login you should land on the **vendor dashboard**.

### Setup & branding
- [ ] Complete any **onboarding** steps if prompted
- [ ] Go to **Settings** → upload a logo, set business name/tagline/accent color
- [ ] Confirm the top header shows your logo and business name

### Create a quote
- [ ] Go to **Quotes** → create a new quote for **Alex & Jordan Miller**
- [ ] Add at least 2 line items and an event date (`[09-15-2026]`)
- [ ] Attach a **PDF contract** (any short PDF is fine)
- [ ] Copy the **public quote link** and send it to the client tester:  
  `[QUOTE LINK]`

**Check:** Dates should look like **MM-DD-YYYY** (e.g. 09-15-2026).

### Quote link (pretend you’re the client once)
- [ ] Open the quote link in a **private/incognito** window (or on the client tester’s phone)
- [ ] Quote layout readable on mobile
- [ ] Contract PDF **opens in the page** (not an error message)
- [ ] **Accept** the quote
- [ ] **Sign** the contract (read/scoll, check the box, sign with a legal name)

### Turn quote into a project
- [ ] Back as vendor: open the quote → **Convert to project**
- [ ] Open the new **project** from Home/Projects
- [ ] Set **payment plan** (deposit + balance is fine)
- [ ] Create and **send a deposit invoice** (small amount, e.g. $500)

### Invite the client to their portal
- [ ] On the project, **generate client invite link** for the client email
- [ ] Send the link to the client tester:  
  `[INVITE LINK]`

### After the client finishes (Part 2)
- [ ] See if **notification bell** shows activity
- [ ] **Mark invoice paid** if they used “I sent payment”
- [ ] Confirm project/contract status looks correct

**Vendor notes:** What felt like too many clicks? Anything you’d expect from HoneyBook/17hats that’s missing?

---

## Part 2 — Client testing (~25 min, mostly on phone)

**Start with the quote link (no account yet):**  
`[QUOTE LINK]`

Then use the **portal invite link** after registering:  
`[INVITE LINK]`

**Portal login (after invite):** https://plannercrm.bytesbyblinken.com/login  
**Email:** `[client@test.com]` · **Password:** `[ask the person who sent this guide]`

### Public quote (before portal account)
- [ ] Open quote link on **phone**
- [ ] Understand total and what you’re booking
- [ ] View contract PDF
- [ ] Accept quote and sign contract

### Client portal — first 3 seconds
- [ ] Open portal after registering via invite
- [ ] See vendor **logo, business name, tagline** in header
- [ ] See your name / project without explanation
- [ ] **Home** tab: status and “what’s next” obvious?

### Documents tab
- [ ] Contract listed
- [ ] PDF loads in the review area (not blank, not JSON error)
- [ ] Sign contract if still needed
- [ ] After signing: **View contract PDF** works

### Payments tab
- [ ] Deposit invoice visible with clear label and amount
- [ ] Payment options make sense (Venmo/Zelle/card — whatever vendor configured)
- [ ] Try **“I’ve sent payment”** if using bank app / Venmo (no real money required if using a test amount)
- [ ] After vendor marks paid, **Home** reflects progress

**Client notes:** Would a stressed couple understand this without calling the vendor? What word or button confused you?

---

## Full path checklist (host — one end-to-end run)

Use this to confirm everything works before or after family testing:

1. [ ] Vendor register → onboarding → branding  
2. [ ] Quote + contract PDF → public link works on mobile  
3. [ ] Accept + sign on quote  
4. [ ] Convert to project → payment plan → deposit invoice  
5. [ ] Client invite → client register → branded portal  
6. [ ] Client sign (if needed) + payment tab  
7. [ ] Vendor notification + mark paid  
8. [ ] After a server redeploy, contract PDF still opens (host verifies)

---

## When something breaks — send the host:

1. **Vendor or client?**  
2. **Phone or computer?** (model + browser if you know)  
3. **Steps:** what you clicked, in order  
4. **Screenshot**  
5. **What you expected vs what happened**

---

## Not bugs (on purpose for now)

- No **Files / deliverables** tab for clients (galleries stay in Pixieset etc.)
- **One contract per project**
- **Emails** may not send — links are copied manually
- **Card pay** only if vendor connected Stripe
- **Calendar** shows booked dates but you can’t add personal reminders yet

---

## End of guide

Questions? Reply to whoever sent you this guide — rough feedback is welcome.
