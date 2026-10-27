# Dá-lhe! — Sprint 0

## Goal

> Anyone (including Claude Code) can clone the repo, start a local database from migrations, generate types with one command, and run the app against local data. The repo is the source of truth for code, schema and planning docs.

Three fronts:

- **Front C: Clean** — remove dead code, dedupe, tidy structure. Low risk; the warm-up for learning Claude Code.
- **Front S: Supabase** — migrations in the repo, local stack in Docker, automatic types, a deploy workflow for prod.
- **Front D: Docs** — `docs/` folder, `CLAUDE.md`, sprint docs mirrored from the claude.ai Project.

Timebox: this sprint delays Sprint 1. Anything not on the cut line moves to the backlog, not to "one more day".

Out of scope: rewriting queries to a new pattern, converting all JS to TS, CI pipelines beyond the optional S7, any Sprint 1 feature.

---

## Current state (observed 2026-10-26, `preview` branch)

- **Database:** 15 tables in `public`, RLS on all of them. **Zero tracked migrations.** Tables and rpcs exist only in the hosted database, edited through the dashboard.
- **Types:** `src/lib/types/supabase.types.ts` is downloaded manually after every database change.
- **Test data:** `lap_time` has a test flag; `GET_TEST_RECORDS` (env var) is passed by each query in `driver.ts`, `leaderboards.ts`, `rig.ts`.
- **Clients:** three ways to reach Supabase: `$lib/supabaseClient.ts`, `event.locals.supabase` (SSR, from `hooks.server.ts`) and `$lib/server/supabaseAdmin.ts` (service role, bypasses RLS).
- **Dead or demo code:** `/demo/*` routes, `/testing` + `/testing/sh` (public echo endpoint, whitelisted in `hooks.server.ts`), `HeroBanner2.svelte`, `New.svelte` (to verify).
- **JS/TS twins:** `ui/*/index.js` beside `index.ts`, `utils.js` beside `utils.ts`, `tsconfig.tsbuildinfo` committed.
- **Docs scattered:** `md/` (roadmap, sprint-1, sprint-1-initial), `src/routes/(authorized)/home/plan.md`, `src/routes/rig/[slug]/doc.md`, `.github/copilot-instructions.md` (stale), `.agents/skills/shadcn-svelte/`.
- **Checks:** `lint` is Prettier only. No type check script.

---

## Decisions to settle before starting

1. ~~**Home OS.**~~ **Settled:** Windows. Docker Desktop with the WSL2 backend.
2. ~~**Seed data.**~~ **Settled:** synthetic users, rigs, sessions, laps and tournaments (`@example.com`, nothing real; the repo is public). Catalog tables (game, cars, car makes/categories, tracks, reference times) are copied from the hosted database, which holds no personal data.
3. ~~**The test flag after this sprint.**~~ **Settled:** keep `for_testing` and `GET_TEST_RECORDS`. Harmless, dropping the column in a migration is riskier than keeping it, and it may help when testing rig endpoints in Sprint 1. Local `.env` sets `GET_TEST_RECORDS=false`.
4. ~~**Prod migrations.**~~ **Settled:** manual `supabase db push` at release time. S7 moves to the backlog.
5. ~~**Planning docs.**~~ **Settled:** the claude.ai Project is the source of truth (it is also where the business model is discussed). The repo holds a copy of the latest sprint docs and other docs.

---

## Front C: Clean

### C1. Remove dead and demo code

_As the developer, I want only live code in the repo, so neither I nor Claude Code waste time reading the wrong files._

- `/demo/*` and `/testing/*` routes deleted; `/testing` paths removed from the `hooks.server.ts` allowlist.
- Unused components removed after a usage check (`HeroBanner2`, `New`, any other unreferenced file).
- `tsconfig.tsbuildinfo` untracked and added to `.gitignore`.
- App builds and every remaining route loads.

### C2. Dedupe JS/TS twins

_As the developer, I want one file per module, so imports are unambiguous._

- Each `index.js` / `index.ts` pair and `utils.js` / `utils.ts` reduced to the `.ts` version; imports updated.
- Remaining `.js` files in `src/lib` listed in the backlog (not converted now).

### C3. Supabase client rules

_As the developer, I want one documented rule for which client to use, so RLS is never bypassed by accident._

- `supabaseClient.ts` removed if unused, or its remaining use documented.
- `supabaseAdmin` only importable from `$lib/server/` (already the case; keep it so).
- The rule is written in `CLAUDE.md` (D2): SSR client by default, admin client only for rig endpoints and with a reason.

### C4. Type check script

_As the developer, I want `pnpm check` to catch type errors, so Claude Code can verify its own work._

- `check` script running `svelte-check` added.
- Current errors either fixed (if few) or listed in the backlog. The script runs clean or with a known baseline.

---

## Front S: Supabase

### S1. Local toolchain

_As the developer, I want the Supabase CLI and a local stack, so I can develop without touching prod._

- Docker Desktop installed with the WSL2 backend.
- Supabase CLI added as a dev dependency, and `supabase` added to `pnpm.onlyBuiltDependencies` in `package.json` (pnpm otherwise blocks the install script that downloads the CLI binary).
- `supabase init` committed (`supabase/config.toml`); project linked to the hosted ref.
- `supabase start` runs; local Studio opens. If the analytics/logging containers fail on Windows, disable analytics in `config.toml` (not needed for this app).

### S2. Baseline migration

_As the developer, I want the current hosted schema as a migration, so the repo becomes the source of truth._

- `supabase db pull` creates the baseline in `supabase/migrations/`, including tables, rpcs, RLS policies, triggers and grants.
- Auth/storage objects checked separately (e.g. a trigger that creates `profiles` on sign-up lives on `auth.users`).
- Remote migration history marks the baseline as applied, so `db push` never tries to re-run it.
- **Done when:** `supabase db reset` locally recreates the schema, and a diff against the linked project is empty.

### S3. Seed data

_As the developer, I want a local database with realistic data, so pages are not empty._

- `supabase/seed.sql` with reference data (game, cars, tracks, reference times) plus synthetic drivers, rigs, sessions and laps.
- At least two local users that can log in (magic link via the local mail inbox).
- No real personal data (Decision 2).

### S4. Automatic types

_As the developer, I want types generated from the database, so I never download them from the dashboard again._

- `pnpm db:types` generates `src/lib/types/supabase.types.ts` from the local database.
- Convenience script that resets the local database and regenerates types in one go.
- Generated file is committed; a header comment says it is generated.

### S5. Local environment config

_As the developer, I want the app to point at the local stack by default in dev._

- `.env.example` committed with every variable the app needs (no values for secrets).
- Local values documented (taken from `supabase status`).
- Login works locally. Google sign-in is optional locally; magic link is enough.

### S6. Change workflow and prod release

_As the developer, I want one documented way to change the database, so dashboard edits stop._

- Documented loop: change locally → create migration (`db diff` or `migration new`) → `db reset` → `db:types` → commit on `preview` → `db push` to prod when releasing.
- Rule: the hosted dashboard is read-only from now on (except data fixes, noted in the PR).
- First real use: a trivial migration (e.g. a table comment) goes through the whole loop to prod.

### S7. (Optional) Migrations on merge to `prod`

_As the developer, I want migrations applied automatically when I release._

- GitHub Action runs `supabase db push` on merge to `prod`.
- Only if Decision 4 says so. Otherwise backlog.

---

## Front D: Docs

### D1. `docs/` folder

_As the developer, I want all planning and design docs in one place._

- `docs/sprints/` (sprint-0, sprint-1), `docs/roadmap.md`, `docs/decisions/` (short notes on choices and why).
- `md/`, `home/plan.md` and `rig/[slug]/doc.md` moved or deleted; `sprint-1-initial.md` deleted.
- `.github/copilot-instructions.md` deleted or reduced to a pointer to `CLAUDE.md`.
- shadcn-svelte skill moved to `.claude/skills/` so Claude Code picks it up.

### D2. `CLAUDE.md`

_As Claude Code, I want a project brief that loads every session, so I start informed._

- Stack, commands (`dev`, `check`, `db:types`, `db reset`), folder map.
- Conventions: thin routes, rpc as source of truth, `$lib/server/rigs/`, client rule (C3), Cache-Control on rig endpoints.
- Database workflow (S6) and the "never edit the hosted dashboard" rule.
- A "Why" section for decisions, filled in by Alex.
- Short: a page or two, linking to `docs/` for detail.
- `.mcp.json` with the Supabase server in read-only mode.

### D3. Sprint doc mirror

_As the developer, I want the repo's sprint docs to match the Project's._

- `docs/sprints/` matches the Project at sprint start; updated again at sprint end with what actually happened.

---

## Suggested order

C1 → C2 → S1 → S2 → S4 → S3 → S5 → S6 → C3 → C4 → D1 → D2 → D3

Cleanup first: low risk, good for learning Claude Code. `CLAUDE.md` last, so it describes the new setup instead of the old one (use `/init` for a throwaway draft at the start if helpful).

Cut line: C4, D3 and S7 can slip. S2, S4 and S6 cannot; they are the point of the sprint.

## Demo script

1. Fresh clone, `pnpm install`, `supabase start`, `supabase db reset`.
2. `pnpm db:types`: `git diff` shows no changes to the types file.
3. `pnpm dev`: log in locally, leaderboards and rig pages show seed data.
4. Add a column in a new migration, reset, regenerate types; the new column appears in the types.
5. Diff against the hosted project shows only that pending migration.

## Impact on Sprint 1

- "Database review" items (`rig_status`, stats upserts, `insert_lap` duplicate handling) become migrations.
- The fake-rig script (A5) targets the local stack by default.
- Decision "Rig identity" (`api_key`) becomes a migration plus seed values.
