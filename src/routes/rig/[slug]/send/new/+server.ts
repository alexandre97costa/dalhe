import { resolveRig, rigJson, rigNotFound, submitLap } from '$lib/server/rigs';

// A finished lap from the overlay. Every handled lap answers 200 with a status
// (created, duplicate, rejected); only unknown rig / wrong key (404) and server errors (500) don't.
export async function GET({ params, url }): Promise<Response> {
	const rig = await resolveRig(params.slug, url.searchParams.get('k'));
	if (!rig) return rigNotFound();

	try {
		return rigJson(await submitLap(rig.rig_id, url.searchParams));
	} catch (error) {
		// Through rigJson, so SimHub doesn't cache the error and keeps retrying
		console.error('Lap not handled:', error);
		return rigJson({ error: 'server_error' }, 500);
	}
}
