import { resolveRig, rigJson, rigNotFound } from '$lib/server/rigs';
import { paramsWithoutKey } from '$lib/server/rigs/debug';

// Echoes what the overlay sent, so it can be checked while building the overlay.
// Same 404 contract as every rig endpoint. Writes nothing; always on (not gated by RIG_DEBUG).
export async function GET({ params, url }): Promise<Response> {
	const rig = await resolveRig(params.slug, url.searchParams.get('k'));
	if (!rig) return rigNotFound();

	return rigJson({
		status: 'ok',
		rigName: rig.rig_name,
		receivedAt: new Date().toISOString(),
		params: paramsWithoutKey(url.searchParams)
	});
}
