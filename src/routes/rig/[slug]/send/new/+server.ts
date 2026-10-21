import { json } from '@sveltejs/kit';
import {
	insertNewLap,
	resolveRig,
	resolveCar,
	resolveTrack,
	rigJson,
	rigNotFound,
	validateRouteParams
} from '$lib/server/rigs';
import * as z from "zod";
import { type NewLap, zNewLap, type NewLapConverted, zNewLapConverted } from '$lib/types/rig';
import { formatLaptime, convertTimeStringToMilliseconds, formatTimeSinceCreation, compareLaptimes } from '$lib/utils/laptime';

export async function GET({ params, url }): Promise<Response> {
	const rig = await resolveRig(params.slug);
	if (!rig) return rigNotFound();

	const validateUrl = validateRouteParams(url.searchParams, zNewLap);
	if (!validateUrl.success) {
		return rigJson({
			success: false,
			error_message: JSON.parse(validateUrl.error.message)
		}, 400);
	}

	const newLap: NewLap = validateUrl.data;

	const validateLap = zNewLapConverted.safeParse({
		rigId: rig.rig_id,
		laptime_ms: newLap.laptime_ms,
		s1_ms: convertTimeStringToMilliseconds(newLap.s1_time),
		s2_ms: convertTimeStringToMilliseconds(newLap.s2_time),
		s3_ms: convertTimeStringToMilliseconds(newLap.s3_time),
		carId: resolveCar(newLap.carId),
		trackId: resolveTrack(newLap.trackId),
	})

	if (!validateLap.success) {
		return rigJson({
			success: false,
			error_message: JSON.parse(validateLap.error.message)
		}, 400);
	}

	const newLapConverted: NewLapConverted = validateLap.data;

	const newLapId = await insertNewLap(newLapConverted);

	if (!newLapId) {
		return rigJson({
			success: false,
			error_message: 'Error inserting. Lap was not created.'
		}, 400);
	}

	return rigJson({
		success: true,
		lap_id: newLapId
	});
}