# PortalHub Database

## Active schema (use these)

| File | Purpose |
|------|---------|
| **`schema_portalhub.sql`** | Full PortalHub schema — run in pgAdmin to create or reset tables |
| **`seed_portalhub_dev.sql`** | Optional dev seed — vendor + client test accounts, Miller Wedding sample data |

### Setup (pgAdmin)

1. Connect to your database
2. Run **`schema_portalhub.sql`** (warning: drops legacy CRM tables if re-run)
3. Optionally run **`seed_portalhub_dev.sql`**

Test logins are documented in `Memory-Bank/techContext.md`.

### Current tables

`users`, `vendor_profiles`, `projects`, `project_clients`, `project_invites`, `milestones`, `contracts`, `invoices`, `deliverables`, `user_sessions`

---

## Legacy Event Planner CRM (deprecated)

The following SQL files are **not used by PortalHub**. Kept for reference only; do not run on a live PortalHub database unless you intend to reset everything.

- `schema.sql`, `sample_data.sql`, `useful_queries.sql`
- `add_client_auth.sql`, `add_event_codes.sql`, `update_schema_for_boilerplate.sql`
- `complete_schema_fix.sql`, `fix_*.sql`, `create_test_user.sql`, `working_passwords.sql`, `update_passwords.sql`

See `archive/legacy-crm/README.md` for details.

---

## Upcoming

Quoting schema will be added as `schema_quotes.sql` or an additive migration when that feature is built.
