import { json } from '@sveltejs/kit';
import { getRigById } from '$lib/queries/rig';
import { supabase } from '$lib/supabaseClient';

export async function GET({ url, locals }): Promise<Response> {
    const { supabase, safeGetSession } = locals;

	const params = Object.fromEntries(url.searchParams.entries());
	const timestamp = new Date().toISOString();

	console.log(`[${timestamp}] GET request received with params:`, params);

	const rig = await getRigById(supabase, params.slug);

	return json({
        rig_name: rig.name,
        driver_name: rig.profiles?.username || null,
	});
}