# Legacy Event Planner CRM SQL (archived)

These files belonged to the pre-pivot **Event Planner CRM** (planner manages clients, events, supplier vendors).

PortalHub replaced that product with a **vendor/client portal** model. The active schema is:

- `../schema_portalhub.sql`
- `../seed_portalhub_dev.sql`

## Files in this archive (reference only)

| File | Notes |
|------|-------|
| `schema.sql` | Old planner CRM tables (clients, events, tasks, supplier vendors) |
| `sample_data.sql` | Sample data for old schema |
| `useful_queries.sql` | Dashboard queries for old CRM |
| Other `*.sql` in parent folder | One-off fixes and migrations for old schema |

**Do not run** legacy schema files on a database that already has PortalHub data unless you intend a full reset via `schema_portalhub.sql`.

Git history preserves deleted application code (legacy CRM pages, routes, models removed June 2026).
