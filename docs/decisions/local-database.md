# Local database first

**Decided:** Sprint 0 (Decisions 1 and 4, S1–S6).

**Choice**

- Development runs against the local Supabase stack (Docker Desktop with the WSL2 backend, on Windows).
- `supabase/migrations/` is the schema. Changes are made as migrations and tested with `pnpm db:reset` before they go anywhere else.
- The hosted database is updated by hand with `supabase db push`, after a `--dry-run`. No automation yet (S7 is in the backlog).

**Why**

- The hosted database is the only one, and prod users depend on it. Experimenting there is risky.
- A schema in the repo can be reviewed, diffed and recreated; dashboard edits can't.
- Manual pushes are enough for a one-person project until a few releases have gone through; automating too early would hide mistakes.

See [database-workflow.md](../database-workflow.md) for the steps.
