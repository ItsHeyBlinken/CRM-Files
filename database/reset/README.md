# Dev reset & seed scripts

Use these in **pgAdmin** to manage test data without touching schema migrations (those live in `database/` root).

| File | When to use |
|------|-------------|
| **`check_dev_seed.sql`** | Diagnose whether seed accounts and project exist |
| **`seed_portalhub_dev.sql`** | First-time dev data after running schema migrations |
| **`reset_keep_seed.sql`** | Clear test clutter; keep `vendor@test.com`, `client@test.com`, Miller Celebration |
| **`wipe_and_reseed_dev.sql`** | Full wipe + fresh seed (use if seed is missing or reset fails) |

### Typical workflows

**Fresh database (after migrations):**
1. `seed_portalhub_dev.sql`

**Messy test data, seed still present:**
1. `check_dev_seed.sql` (optional)
2. `reset_keep_seed.sql`

**Seed missing or you want a clean slate:**
1. `wipe_and_reseed_dev.sql`

Test logins: `vendor@test.com` / `client@test.com` — password `Password123!` (see `Memory-Bank/techContext.md`).

**Note:** These scripts do not delete files in `server/uploads/`.
