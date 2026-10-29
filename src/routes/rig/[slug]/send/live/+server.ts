import { json } from '@sveltejs/kit';
import {
	insertNewLap,
	pollResponse,
	resolveRig,
	resolveCar,
	resolveTrack,
	rigJson,
	rigNotFound,
	validateRouteParams
} from '$lib/server/rigs';
import * as z from 'zod';
import { type NewLap, zNewLap, type NewLapConverted, zNewLapConverted } from '$lib/types/rig';
import {
	formatLaptime,
	convertTimeStringToMilliseconds,
	formatTimeSinceCreation,
	compareLaptimes
} from '$lib/utils/laptime';

export async function GET({ params, url }): Promise<Response> {
	const rig = await resolveRig(params.slug, url.searchParams.get('k'));
	if (!rig) {
		return rigNotFound();
	}
	return rigJson(pollResponse(rig));
}
