import { json } from '@sveltejs/kit';
import { getRigById } from '$lib/queries/rig';
import { supabase } from '$lib/supabaseClient';

export async function GET({ url, locals }): Promise<Response> {
    const { supabase, safeGetSession } = locals;

    const params = Object.fromEntries(url.searchParams.entries());
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] GET request received with params:`, params);

    // TODO: Implement logic to send session and lap stats to DB

    return json({ message: 'GET request received', params });
}