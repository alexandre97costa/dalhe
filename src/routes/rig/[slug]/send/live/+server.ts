import { resolveRig, rigJson, rigNotFound, submitStats } from '$lib/server/rigs';

// Live lap stats from the overlay: 200 with ok (stored), ignored (no active session) or rejected.
export async function GET({ params, url }): Promise<Response> {
	const rig = await resolveRig(params.slug, url.searchParams.get('k'));
	if (!rig) return rigNotFound();

	try {
		return rigJson(await submitStats(rig.rig_id, 'lap', url.searchParams));
	} catch (error) {
		// Through rigJson, so SimHub doesn't cache the error
		console.error('Stats not handled:', error);
		return rigJson({ error: 'server_error' }, 500);
	}
}
