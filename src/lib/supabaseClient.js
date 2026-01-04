// to be used in SvelteKit load functions and endpoints (server-side only)
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

export const supabase = createClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    // auth: {
    //     autoRefreshToken: false,
    //     persistSession: false,
    //     detectSessionInUrl: false
    // }
})