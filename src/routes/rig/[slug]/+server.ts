import { json } from '@sveltejs/kit';
import { getRigById } from '$lib/queries/rig';

/*
This route is used by the rig to poll its name and connected user (if any)
*/

export async function GET({ url, locals, params }): Promise<Response> {
    const { supabase, safeGetSession } = locals;
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] GET request received. /rig/${params.slug}`);

	const rig = await getRigById(supabase, params.slug);

	return json({
        rig_name: rig.name,
        driver_name: rig.profiles?.username || null,
	});
}