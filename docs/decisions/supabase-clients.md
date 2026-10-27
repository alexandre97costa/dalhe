# Supabase clients

**Decided:** Sprint 0 (C3).

**Choice**

- Server code (load functions, actions, endpoints) uses `locals.supabase`, created per request in `hooks.server.ts`. It runs as the logged-in user (or anon), so RLS applies.
- `supabaseAdmin` (`$lib/server/supabaseAdmin.ts`) bypasses RLS. Only rig endpoints use it, because they have no user session; each call site says why.
- The browser client from the `+layout.ts` files is only for listening to auth state changes.
- No module-level client shared across requests. Query helpers in `$lib/queries/` take a `TypedSupabaseClient` argument.

**Why**

- A shared module-level client mixes requests and skips the user's session, so RLS can't do its job.
- Keeping the service role key under `$lib/server/` means SvelteKit refuses to bundle it into browser code.
