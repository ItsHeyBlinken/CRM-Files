# Gigly Database

## Active schema (run in order)

Run these **in numeric order** in pgAdmin. If starting over, run `001` through `008`, then optionally seed.

### Naming convention (new migrations)

All **schema migrations** use a **3-digit prefix** and live in `database/` (not `reset/`):

```
NNN_short_descriptive_name.sql
```

| Rule | Detail |
|------|--------|
| **Next number** | `010` (then `011`, `012`, …) |
| **Prefix** | Zero-padded: `008`, not `8` |
| **Suffix** | Short snake_case description of what the migration does |
| **Header** | Include `Migration NNN — run AFTER NNN_previous_file.sql` |
| **README** | Add the new file to the table below in numeric order |
| **Additive** | Prefer `IF NOT EXISTS` / idempotent patterns; safe to run once |
| **Not numbered** | Dev reset/seed scripts stay in `database/reset/` |

Example for the next migration: `009_schema_vendor_subscriptions.sql`

| # | File | Purpose |
|---|------|---------|
| 001 | **`001_schema_portalhub.sql`** | Full PortalHub schema — creates or resets tables |
| 002 | **`002_schema_quotes_addition.sql`** | Quotes + line items |
| 003 | **`003_schema_contract_ack_enhancement.sql`** | Contract e-sign audit fields (legal name, PDF hash, etc.) |
| 004 | **`004_schema_payments_addition.sql`** | Vendor payment settings + invoice payment tracking |
| 005 | **`005_schema_vendor_onboarding.sql`** | `payment_setup_complete` flag for onboarding gate |
| 006 | **`006_schema_quote_contract_addition.sql`** | Optional contract PDF attached to quotes |
| 007 | **`007_schema_quote_contract_signing.sql`** | E-sign on quote link after acceptance |
| 008 | **`008_project_payment_settings.sql`** | Project-level payment setup defaults + invoice kind metadata |
| 009 | **`009_vendor_notifications.sql`** | In-app vendor notifications for client actions |

### Dev reset & seed (`reset/`)

| File | Purpose |
|------|---------|
| **`reset/check_dev_seed.sql`** | Diagnose whether seed accounts and project exist |
| **`reset/seed_portalhub_dev.sql`** | Optional dev seed — vendor + client test accounts, Miller Celebration |
| **`reset/reset_keep_seed.sql`** | Delete test clutter; keep seed accounts + Miller Celebration |
| **`reset/wipe_and_reseed_dev.sql`** | Delete everything and restore fresh seed accounts |

See **`reset/README.md`** for when to use each script.

**Fresh start from scratch (pgAdmin):**

1. Connect to your database and open Query Tool
2. Run **`001_schema_portalhub.sql`** through **`008_project_payment_settings.sql`** in order  
   (`001` drops legacy CRM tables — all app data is removed)
3. Optionally run **`reset/seed_portalhub_dev.sql`**

Test logins are documented in `Memory-Bank/techContext.md`.

### Current tables

`users`, `vendor_profiles`, `vendor_payment_settings`, `project_payment_settings`, `projects`, `project_clients`, `project_invites`, `milestones`, `contracts`, `invoices`, `deliverables`, `user_sessions`, `quotes`, `quote_line_items`, `quote_contracts`

---

## Legacy Event Planner CRM (deprecated)

The following SQL files are **not used by PortalHub**. Kept for reference only; do not run on a live PortalHub database unless you intend to reset everything.

- `schema.sql`, `sample_data.sql`, `useful_queries.sql`
- `add_client_auth.sql`, `add_event_codes.sql`, `update_schema_for_boilerplate.sql`
- `complete_schema_fix.sql`, `fix_*.sql`, `create_test_user.sql`, `working_passwords.sql`, `update_passwords.sql`

See `archive/legacy-crm/README.md` for details.

---

## Upcoming

Milestone editing from project detail; Stripe Billing for vendor subscriptions (Phase 3e); transactional email provider.
