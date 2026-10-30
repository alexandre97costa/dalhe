import { SESSION_TIMEOUT_MINS, GET_TEST_RECORDS } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { json } from '@sveltejs/kit';
import * as z from 'zod';
import {
	type SessionStats,
	type LapStats,
	type NewLapConverted,
	zNewLap,
	zNewLapConverted
} from '$lib/types/rig';
import {
	formatLaptime,
	convertTimeStringToMilliseconds,
	formatTimeSinceCreation,
	compareLaptimes
} from '$lib/utils/laptime';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export function rigJson<T>(body: T, status = 200): Response {
	return json(body, { status, headers: NO_STORE });
}

// One fixed body for every "can't find it" case: unknown rig, malformed UUID, missing or wrong key.
// Never include the id or a reason, or you leak whether the rig exists.
export function rigNotFound(): Response {
	return rigJson({ error: 'not_found' }, 404);
}

// One row of rig_status. The generated type marks every field non-null, but the
// session and driver fields are null when no session is active or nobody connected.
export type RigStatus = {
	rig_id: string;
	rig_name: string;
	session_active: boolean;
	session_id: string | null;
	driver_id: string | null;
	driver_name: string | null;
};

// What the overlay gets back: no ids (Sprint 1, Decision 3).
export type RigPoll = {
	rigName: string;
	sessionActive: boolean;
	driverName: string | null;
};

export function pollResponse(rig: RigStatus): RigPoll {
	return {
		rigName: rig.rig_name,
		sessionActive: rig.session_active,
		driverName: rig.driver_name
	};
}

// Every rig endpoint goes through here. `key` is the rig's secret (`?k=`); never log it.
export async function resolveRig(rigId: string, key: string | null): Promise<RigStatus | null> {
	const uuid = z.uuid({ version: 'v4' });
	const validate = uuid.safeParse(rigId);
	if (!validate.success || !key) return null;

	// Admin client: rig_key has no policies or client grants, only the service role can read it.
	const { data: rigKey, error: keyError } = await supabaseAdmin
		.from('rig_key')
		.select('rig_id')
		.eq('rig_id', rigId)
		.eq('api_key', key)
		.maybeSingle();

	if (keyError) {
		console.log('resolveRig key error:', keyError.message);
		return null;
	}
	if (!rigKey) return null;

	const { data, error } = await supabaseAdmin.rpc('rig_status', {
		p_expiry_minutes: parseInt(SESSION_TIMEOUT_MINS),
		p_rig_id: rigId
	});

	if (error) {
		console.log('resolveRig error:', error);
		return null;
	}

	if (!Array.isArray(data) || data.length === 0) return null;
	return data[0];
}

export async function resolveCar(carId: string): Promise<{ id: number } | null> {
	const carIdSchema = z.string().nonempty();
	const validate = carIdSchema.safeParse(carId);
	if (!validate.success) return null;

	const { data, error } = await supabaseAdmin
		.from('car')
		.select('id')
		.eq('simhub_carid', carId)
		.maybeSingle();

	// A database error is not an unknown car: let it become a 500 so the overlay retries
	if (error) throw error;
	return data;
}

export async function resolveTrack(trackId: string): Promise<{ id: number } | null> {
	const trackIdSchema = z.string().nonempty();
	const validate = trackIdSchema.safeParse(trackId);
	if (!validate.success) return null;

	const { data, error } = await supabaseAdmin
		.from('race_track')
		.select('id')
		.eq('simhub_trackid', trackId)
		.maybeSingle();

	if (error) throw error;
	return data;
}

export function validateRouteParams<T extends z.ZodType>(params: URLSearchParams, schema: T) {
	return schema.safeParse(Object.fromEntries(params));
}

// Every handled lap gets a 200 with one of these (Sprint 1, Decision 5)
export type LapRejectReason =
	| 'invalid_params'
	| 'sectors_mismatch'
	| 'unknown_car'
	| 'unknown_track';
export type LapOutcome =
	| { status: 'created'; lapId: number }
	| { status: 'duplicate' }
	| { status: 'rejected'; reason: LapRejectReason };

// Parses, validates and stores a lap from the overlay's query params.
// Throws only on server errors (the endpoint answers 500 and the overlay retries).
export async function submitLap(rigId: string, params: URLSearchParams): Promise<LapOutcome> {
	const reject = (reason: LapRejectReason): LapOutcome => {
		// Logged so a lap on a car or track missing from the catalog can be recovered by hand. Never the key.
		const logged = Object.fromEntries([...params].filter(([name]) => name !== 'k'));
		console.warn('Lap rejected:', reason, { rigId, ...logged });
		return { status: 'rejected', reason };
	};

	const parsed = validateRouteParams(params, zNewLap);
	if (!parsed.success) return reject('invalid_params');
	const newLap = parsed.data;

	const car = await resolveCar(newLap.carId);
	if (!car) return reject('unknown_car');
	const track = await resolveTrack(newLap.trackId);
	if (!track) return reject('unknown_track');

	const converted = zNewLapConverted.safeParse({
		rigId,
		laptime_ms: newLap.laptime_ms,
		s1_ms: convertTimeStringToMilliseconds(newLap.s1_time),
		s2_ms: convertTimeStringToMilliseconds(newLap.s2_time),
		s3_ms: convertTimeStringToMilliseconds(newLap.s3_time),
		carId: car.id,
		trackId: track.id
	});
	if (!converted.success) return reject('invalid_params');

	const lap = converted.data;
	if (lap.laptime_ms !== lap.s1_ms + lap.s2_ms + lap.s3_ms) return reject('sectors_mismatch');

	return insertNewLap(lap);
}

export async function insertNewLap(l: NewLapConverted): Promise<LapOutcome> {
	const { data, error } = await supabaseAdmin.rpc('insert_lap', {
		p_timeout_minutes: parseInt(SESSION_TIMEOUT_MINS),
		p_for_testing: GET_TEST_RECORDS === 'true',
		p_rig_id: l.rigId,
		p_lap_time_ms: l.laptime_ms,
		p_s1_ms: l.s1_ms,
		p_s2_ms: l.s2_ms,
		p_s3_ms: l.s3_ms,
		p_car_id: l.carId,
		p_track_id: l.trackId
	});

	if (error) throw error;

	const row = data[0];
	if (row?.status === 'created' && row.lap_id !== null)
		return { status: 'created', lapId: row.lap_id };
	if (row?.status === 'duplicate') return { status: 'duplicate' };
	throw new Error(`insert_lap returned an unexpected row: ${JSON.stringify(row)}`);
}
