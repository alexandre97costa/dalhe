// Which Supabase client to use:
// - Server code (load functions, actions, endpoints): `locals.supabase`, created per request in
//   hooks.server.ts. It runs as the logged-in user (or anon), so RLS applies.
// - `supabaseAdmin` ($lib/server/supabaseAdmin.ts) bypasses RLS. Only for rig endpoints, which
//   have no user session; say why at each call site.
// - The browser client in the +layout.ts files is only for listening to auth state changes.
// - Never create a module-level client shared across requests.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/supabase.types';

// Query helpers in $lib/queries take this so they work with any of the clients above.
export type TypedSupabaseClient = SupabaseClient<Database>;
