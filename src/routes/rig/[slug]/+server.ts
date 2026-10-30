import { json } from '@sveltejs/kit';
import { pollResponse, resolveRig, rigJson, rigNotFound } from '$lib/server/rigs';

export async function GET({ params, url }): Promise<Response> {
	const rig = await resolveRig(params.slug, url.searchParams.get('k'));
	if (!rig) {
		return rigNotFound();
	}
	return rigJson(pollResponse(rig));
}
