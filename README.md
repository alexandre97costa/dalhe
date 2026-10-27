# DA-LHE

A web app that displays track times in racing sims. Built with SvelteKit, Supabase and ShadCN.

## Local development

Needs Node 22, pnpm and Docker Desktop (WSL2 backend on Windows).

```bash
pnpm install
cp .env.example .env
pnpm exec supabase start   # local Supabase stack in Docker
pnpm db:reset              # apply migrations + seed, regenerate types
pnpm dev                   # http://localhost:5173
```

`.env` points at the local stack. The URL and publishable key are Supabase CLI defaults and work as committed. For the rig endpoints, set `SUPABASE_SERVICE_ROLE_KEY` to `SECRET_KEY` from `pnpm exec supabase status` (it is not committed: GitHub blocks secret keys).

### Logging in

Login is by magic link. Locally, emails never leave your machine: they land in Mailpit at http://127.0.0.1:54324.

1. On `/login`, enter one of the seed users: `alice@example.com`, `bruno@example.com`, `carla@example.com` or `diogo@example.com`. Any other address also works and creates a new user.
2. Open the email in Mailpit and click the link.

### Local URLs

| What                  | URL                    |
| --------------------- | ---------------------- |
| App                   | http://localhost:5173  |
| Studio (database UI)  | http://127.0.0.1:54323 |
| Mailpit (local inbox) | http://127.0.0.1:54324 |
| API                   | http://127.0.0.1:54321 |

### Database scripts

- `pnpm db:reset`: recreate the local database from `supabase/migrations/` and `supabase/seed.sql`, then regenerate types.
- `pnpm db:types`: regenerate `src/lib/types/supabase.types.ts` from the local database.

### Against the hosted database

Hosted values live in Vercel. To run local code against the hosted database for a one-off, keep them in an untracked `.env.hosted` and swap it in for `.env` temporarily. Remember that this writes to production data.
