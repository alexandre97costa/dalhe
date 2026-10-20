import { json } from '@sveltejs/kit';
import { 
	insertNewLap,
	resolveRig, 
	rigJson, 
	rigNotFound, 
	validateRouteParams 
} from '$lib/server/rigs';
import * as z from "zod";
import { type NewLap, NewLapSchema } from '$lib/types/rig';

export async function GET({ params, url }): Promise<Response> {
	const rig = await resolveRig(params.slug);
	if (!rig) {
		return rigNotFound();
	}

	const validationResult = validateRouteParams(url.searchParams, NewLapSchema);
	if (!validationResult.success) {
		return rigJson({ 
			success: false, 
			validation_errors: JSON.parse(validationResult.error.message) 
		}, 400);
	}

	let newLap: NewLap = validationResult.data;
	newLap.rigId = rig.rig_id;

	await insertNewLap(newLap);

	return rigJson({
		success: true,
		data: newLap
	 });
}