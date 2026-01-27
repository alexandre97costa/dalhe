// to be used in SvelteKit load functions and endpoints (server-side only)
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/supabase.ts';

export const supabase = createClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    // auth: {
    //     autoRefreshToken: false,
    //     persistSession: false,
    //     detectSessionInUrl: false
    // }
})