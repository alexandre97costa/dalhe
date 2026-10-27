// Service role client: bypasses RLS. Only for rig endpoints ($lib/server/rigs), which have no
// user session. Everything else uses `locals.supabase` (see $lib/types/supabase.ts).
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { Database } from '$lib/types/supabase.types';

export const supabaseAdmin = createClient<Database>(
	PUBLIC_SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: { persistSession: false, autoRefreshToken: false }
	}
);
