# Dá-lhe!

A web app for sim racing friends and family: lap times from shared rigs, leaderboards and (soon) a live lounge per rig. Rigs talk to the app through SimHub. Planning and decisions live in [`docs/`](docs/); the current sprint is in [`docs/sprints/`](docs/sprints/).

## Stack

SvelteKit 2 with Svelte 5 runes, Supabase (`@supabase/ssr`), shadcn-svelte (bits-ui) on Tailwind 4, Paraglide for i18n (en/pt), zod and sveltekit-superforms for forms. Deployed on Vercel. Windows dev machine; Node 22, pnpm.

## Commands

| Command                               | What it does                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm exec supabase start` / `status` | Local Supabase stack in Docker / its URLs and keys                                               |
| `pnpm dev`                            | Dev server on http://localhost:5173                                                              |
| `pnpm check`                          | Type check. Baseline: 0 errors, 0 warnings (the old backlog list is all fixed); don't add to it. |
| `pnpm lint` / `pnpm format`           | Prettier check / fix                                                                             |
| `pnpm build`                          | Production build                                                                                 |
| `pnpm db:reset`                       | Recreate the local database from migrations + `supabase/seed.sql`, then regenerate types         |
| `pnpm db:types`                       | Regenerate `src/lib/types/supabase.types.ts` from the local database (never edit it by hand)     |
| `pnpm rig <scenario…\|all>`           | Fake rig: call the rig endpoints against the local stack (`pnpm rig` lists scenarios)            |
| `pnpm exec supabase test db`          | pgTAP database tests in `supabase/tests/database/`                                               |

Local login: request a magic link for a seed user (`alice@example.com`, `bruno@…`, `carla@…`, `diogo@…`) and open it from Mailpit at http://127.0.0.1:54324.

## Where things are

- `src/routes/(authorized)/`: the app (home, leaders, driver, connect + lounge, profile, tournaments). `(landingpage)/`: public landing page. `login/`: magic-link flow. `rig/[slug]/`: endpoints SimHub calls.
- `src/lib/queries/`: Supabase queries, one function each, taking a `TypedSupabaseClient`.
- `src/lib/server/rigs/`: rig endpoint logic (resolve rig/car/track, validation, `rigJson`). `src/lib/server/supabaseAdmin.ts`: service-role client.
- `src/lib/types/`: generated database types, the client type and the client rule, listing types.
- `src/lib/components/ui/`: shadcn-svelte components (use the `shadcn-svelte` skill to add or change them).
- `supabase/migrations/`, `supabase/seed.sql`, `supabase/templates/`: schema, local data, local auth emails.

## Conventions

- **Thin routes.** Load functions and actions call `$lib/queries` or database functions; no query logic inline in pages.
- **The database is the source of truth.** Business rules (lap inserts, ratings, sessions) live in Postgres functions and triggers; the app calls them via `rpc`.
- **Supabase clients** ([decision](docs/decisions/supabase-clients.md)): server code uses `locals.supabase` (per request, RLS applies). `supabaseAdmin` only in rig endpoints, with a reason at the call site. Never a module-level shared client.
- **Rig endpoints** respond through `rigJson`/`rigNotFound` in `$lib/server/rigs/`, which set `Cache-Control: no-store` so SimHub never caches a response.

## Database workflow

Full steps in [`docs/database-workflow.md`](docs/database-workflow.md).

- Schema changes are migrations: `supabase migration new <name>` (or `supabase db diff`), then `pnpm db:reset`, then commit.
- The hosted dashboard is **read-only** for schema. Never edit a migration that was already pushed.
- `supabase db push` to the hosted database only for migrations that don't break `prod`, after reviewing `--dry-run`, and only when asked.
- Migrations are stored byte-for-byte (`-text`): some function bodies contain CRLF. Don't reformat or re-save them with an editor tool.

## Branches

`chore/*` branch per task → pull request → `preview`. `prod` is the release branch and stays untouched for now ([decision](docs/decisions/release-flow.md)). Plan and ask before editing or committing; don't push unless asked.

## Hard rules

- **No real personal data** in the repo (it's public): seed users are `@example.com`.
- **HTTP requests to `/rig/[slug]/*` only against the local stack.** SimHub can only send GETs, so these endpoints create sessions and laps even on GET. Testing them is fine on `preview` or a branch of it, with the dev server and `.env` pointing at the local database (`PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`). Never against the hosted database, a Vercel deployment, or from `prod`.
- **No secret keys in committed files.** GitHub push protection rejects them, even the local CLI default. Local secrets go in `.env` (untracked); hosted values live in Vercel.

## Why

Short reasons for the choices above. Details in [`docs/decisions/`](docs/decisions/).

- [Local database first](docs/decisions/local-database.md): Database branching (same schema, different contents) is a paid feature in Supabase, which we don't have access to. Local database development allows me to work with actual data without interfering with the prod DB.
- [Release flow](docs/decisions/release-flow.md): `prod` branch should only be touched when changes are ready to be shown to the public. `preview` is the working copy and should reflect the most recent (stable) changes.
- [Seed data](docs/decisions/seed-data.md): Some fixed table data (game, car, car_category, car_make, race_track) should stay fixed and mirror prod. Any changes here require small migrations. All other tables have fairly random contents.
- [Test flag](docs/decisions/test-flag.md): Obsolete since the local database advent, but could be useful for rig communication testing. Lets leave it for now, delete later.
- [Planning docs](docs/decisions/planning-docs.md): The source of truth is a claude.ai project which is where i discuss the planning and sprints. Everytime plans and sprints are updated, they are commited to the docs folder.
- [Supabase clients](docs/decisions/supabase-clients.md): Most information is queried through the supabase client for authenticated users. There's an exception for the rig communication, which is made by supabaseAdmin and bypasses RLS. Any connection made through admin should have stern validation and safe guards.
