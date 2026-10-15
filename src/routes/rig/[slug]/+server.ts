import { json } from '@sveltejs/kit';
import { resolveRig, rigJson, rigNotFound } from '$lib/server/rigs';

export async function GET({ params }): Promise<Response> {
	const rig = await resolveRig(params.slug);
	if (!rig) {
		return rigNotFound();
	}
	return rigJson(rig);
}