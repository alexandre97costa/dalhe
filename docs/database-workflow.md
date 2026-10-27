# Database workflow

The repo is the source of truth for the schema: `supabase/migrations/` defines it, `supabase/seed.sql` fills the local database. The hosted dashboard is **read-only** for schema.

## Branches and the hosted database

- `main` is the release branch (what prod users run). It stays untouched for now: `preview` removed manual lap entry while the rig flow isn't ready.
- Work happens on `chore/*` branches and moves into `preview`.
- There is **one** hosted database, shared by `main` (prod) and `preview` deploys. A migration pushed to it affects the code running on `main` immediately, whatever branch it came from.

## Changing the schema

1. Start the local stack: `pnpm exec supabase start`.
2. Create a migration:
   - by hand: `pnpm exec supabase migration new <name>`, then write the SQL in the new file;
   - or make the change in local Studio (http://127.0.0.1:54323) and capture it with `pnpm exec supabase db diff -f <name>`.
3. `pnpm db:reset`: rebuilds the local database from all migrations plus the seed, and regenerates `src/lib/types/supabase.types.ts`.
4. Update the code and the seed if needed; check the app locally.
5. Commit the migration, the types file and the code together on a `chore/*` branch.

## Catalog data (cars, tracks, games, reference times)

New catalog rows are added as a migration, not in the dashboard, so prod and local get the same rows:

```sql
insert into public.car (id, make_id, model, year, category_id, simhub_carid)
values (32, 18, 'Mustang GT3 Evo', 2025, 1, null)
on conflict (id) do nothing;
```

`seed.sql` keeps the snapshot it was created from; migrations run before the seed, so the new rows are there locally too. Use an explicit id beyond the current maximum, and move the identity sequence on if needed.

## Pushing to the hosted database

Push only migrations that **don't break the code on `main`**. Always dry-run first:

```bash
pnpm exec supabase db push --dry-run
```

Read the list of migrations it would apply and judge each one against `main`:

- **Safe to push:** additive changes (new tables, nullable columns, new functions, comments, indexes, catalog inserts, policies that don't remove access `main` relies on).
- **Keep local until release:** dropping or renaming tables, columns or functions; changing a function's arguments or return type; new `NOT NULL` columns without a default; tightened policies that `main` depends on.

Then push:

```bash
pnpm exec supabase db push
```

`pnpm exec supabase migration list --linked` shows which migrations the hosted database has applied.

## Rules

- No schema edits in the hosted dashboard. Data fixes are allowed; note them in the PR that motivated them.
- Never edit a migration that has been pushed. Write a new one.
- Check for drift (dashboard edits that bypassed this workflow) with `pnpm exec supabase db diff --linked`. It should be empty apart from migrations not yet pushed.
- Migration files are stored byte-for-byte (`.gitattributes`): some hosted function bodies contain CRLF.
