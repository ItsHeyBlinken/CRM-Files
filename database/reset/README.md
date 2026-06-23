# Dev reset & seed scripts

Use these in **pgAdmin** to manage test data without touching schema migrations (those live in `database/` root).

**Go-live script maintenance:** When numbered migrations add new tables, update `clear_all_data_keep_schema.sql` — checklist in `Memory-Bank/systemPatterns.md` and `Memory-Bank/activeContext.md`.

| File | When to use |
|------|-------------|
| **`check_dev_seed.sql`** | Diagnose whether seed accounts and project exist |
| **`seed_portalhub_dev.sql`** | First-time dev data after running schema migrations |
| **`reset_keep_seed.sql`** | Clear test clutter; keep `vendor@test.com`, `client@test.com`, Miller Celebration |
| **`clear_all_data_keep_schema.sql`** | **Production go-live:** wipe ALL rows; keep current schema (no test accounts re-inserted) |
| **`wipe_and_reseed_dev.sql`** | Full wipe + fresh seed (use if seed is missing or reset fails) |

### Typical workflows

**Fresh database (after migrations):**
1. `seed_portalhub_dev.sql`

**Messy test data, seed still present:**
1. `check_dev_seed.sql` (optional)
2. `reset_keep_seed.sql`

**Production go-live (schema already at 001–013, remove all test data):**
1. Back up the database in pgAdmin
2. `clear_all_data_keep_schema.sql`
3. Clear or replace `server/uploads/` on the server if needed
4. Create your real vendor account via the live site (Register)

**Seed missing or you want a clean slate:**
1. `wipe_and_reseed_dev.sql`

Test logins: `vendor@test.com` / `client@test.com` — password `Password123!` (see `Memory-Bank/techContext.md`).

**Note:** These scripts do not delete files in `server/uploads/`. After `clear_all_data_keep_schema.sql`, old upload paths in the DB are gone but files may still exist on disk until you clean the uploads volume.
