import { SESSION_TIMEOUT_MINS, GET_TEST_RECORDS } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { json } from '@sveltejs/kit';
import * as z from 'zod';
import {
	type SessionStats,
	type LapStats,
	type NewLapConverted,
	zLapStats,
	zNewLap,
	zNewLapConverted,
	zSessionStats
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
	driver_avatar_url: string | null;
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
		console.error('resolveRig key error:', keyError.message);
		return null;
	}
	if (!rigKey) return null;

	const { data, error } = await supabaseAdmin.rpc('rig_status', {
		p_expiry_minutes: parseInt(SESSION_TIMEOUT_MINS),
		p_rig_id: rigId
	});

	if (error) {
		console.error('resolveRig error:', error);
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

// The values the server would use for a lap, as returned by a dry run. Null where a value
// couldn't be read or the catalog lookup failed.
export type ParsedLap = {
	laptimeMs: number | null;
	s1Ms: number | null;
	s2Ms: number | null;
	s3Ms: number | null;
	carId: number | null;
	trackId: number | null;
};

// A dry run (`dryRun=1`) answers with the status a real lap would get, and writes nothing.
export type LapDryRunOutcome = (
	| { status: 'created' }
	| { status: 'duplicate' }
	| { status: 'rejected'; reason: LapRejectReason }
) & { dryRun: true; parsed: ParsedLap; driverName: string | null };

// `dryRun`: absent, 0 or false → a real lap; 1 or true → a dry run; anything else → null
// (rejected as invalid_params, so a typo never inserts a real lap).
export function parseDryRun(value: string | null): boolean | null {
	if (value === null) return false;
	const v = value.trim().toLowerCase();
	if (v === '0' || v === 'false') return false;
	if (v === '1' || v === 'true') return true;
	return null;
}

type LapCheck =
	| { reason: LapRejectReason; parsed: ParsedLap; lap: null }
	| { reason: null; parsed: ParsedLap; lap: NewLapConverted };

// Every rule a lap goes through before the database, shared by real laps and dry runs.
// Reasons come in a fixed order: params, car, track, sector values, sector sum.
async function checkLap(rigId: string, params: URLSearchParams): Promise<LapCheck> {
	const parsed: ParsedLap = {
		laptimeMs: null,
		s1Ms: null,
		s2Ms: null,
		s3Ms: null,
		carId: null,
		trackId: null
	};

	const validated = validateRouteParams(params, zNewLap);
	if (!validated.success) return { reason: 'invalid_params', parsed, lap: null };
	const newLap = validated.data;

	const car = await resolveCar(newLap.carId);
	const track = await resolveTrack(newLap.trackId);
	parsed.laptimeMs = newLap.laptime_ms;
	parsed.s1Ms = convertTimeStringToMilliseconds(newLap.s1_time);
	parsed.s2Ms = convertTimeStringToMilliseconds(newLap.s2_time);
	parsed.s3Ms = convertTimeStringToMilliseconds(newLap.s3_time);
	parsed.carId = car?.id ?? null;
	parsed.trackId = track?.id ?? null;

	if (!car) return { reason: 'unknown_car', parsed, lap: null };
	if (!track) return { reason: 'unknown_track', parsed, lap: null };

	const converted = zNewLapConverted.safeParse({
		rigId,
		laptime_ms: parsed.laptimeMs,
		s1_ms: parsed.s1Ms,
		s2_ms: parsed.s2Ms,
		s3_ms: parsed.s3Ms,
		carId: car.id,
		trackId: track.id
	});
	if (!converted.success) return { reason: 'invalid_params', parsed, lap: null };

	const lap = converted.data;
	// Strict on purpose (Sprint 1.5, X2): no stored lap had sectors to measure a drift against.
	// If real laps get `sectors_mismatch` by a millisecond or two, add a tolerance here and in the docs.
	if (lap.laptime_ms !== lap.s1_ms + lap.s2_ms + lap.s3_ms)
		return { reason: 'sectors_mismatch', parsed, lap: null };

	return { reason: null, parsed, lap };
}

// Parses, validates and stores a lap from the overlay's query params, or with `dryRun=1`
// runs the same checks and writes nothing.
// Throws only on server errors (the endpoint answers 500 and the overlay retries).
export async function submitLap(
	rig: RigStatus,
	params: URLSearchParams
): Promise<LapOutcome | LapDryRunOutcome> {
	const rigId = rig.rig_id;
	const reject = (reason: LapRejectReason): LapOutcome => {
		// Logged so a lap on a car or track missing from the catalog can be recovered by hand. Never the key.
		const logged = Object.fromEntries([...params].filter(([name]) => name !== 'k'));
		console.warn('Lap rejected:', reason, { rigId, ...logged });
		return { status: 'rejected', reason };
	};

	const dryRun = parseDryRun(params.get('dryRun'));
	if (dryRun === null) return reject('invalid_params');

	const check = await checkLap(rigId, params);
	if (!dryRun) return check.lap ? insertNewLap(check.lap) : reject(check.reason);

	// Dry run: no recovery log for rejections (they show up in the RIG_DEBUG log only).
	// The driver comes from rig_status (same lazy expiry as the poll): null = anonymous / unclaimed.
	const extra = {
		dryRun: true as const,
		parsed: check.parsed,
		driverName: rig.session_active ? rig.driver_name : null
	};
	if (!check.lap) return { status: 'rejected', reason: check.reason, ...extra };
	if (await isDuplicateLap(check.lap)) return { status: 'duplicate', ...extra };
	return { status: 'created', ...extra };
}

// The duplicate rule lives in the database (lap_is_duplicate), shared with insert_lap.
async function isDuplicateLap(l: NewLapConverted): Promise<boolean> {
	const { data, error } = await supabaseAdmin.rpc('lap_is_duplicate', {
		p_track_id: l.trackId,
		p_car_id: l.carId,
		p_lap_time_ms: l.laptime_ms,
		p_s1_ms: l.s1_ms,
		p_s2_ms: l.s2_ms,
		p_s3_ms: l.s3_ms
	});
	if (error) throw error;
	return data === true;
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

// Every handled stats call gets a 200 with one of these (Sprint 1, Decision 5)
export type StatsOutcome =
	| { status: 'ok' }
	| { status: 'ignored' }
	| { status: 'rejected'; reason: 'invalid_params' };

// Stores the latest live lap stats (`lap`, /send/live) or sim session stats (`session`, /send/session)
// for the rig, only while it has an active session. Never creates a session or refreshes its activity.
// Throws only on server errors.
export async function submitStats(
	rigId: string,
	kind: 'lap' | 'session',
	params: URLSearchParams
): Promise<StatsOutcome> {
	const schema = kind === 'lap' ? zLapStats : zSessionStats;
	const parsed = validateRouteParams(params, schema);
	if (!parsed.success) {
		// Stats arrive often: log which fields failed, not the params
		console.warn(
			`Stats rejected (${kind}):`,
			parsed.error.issues.map((i) => i.path.join('.'))
		);
		return { status: 'rejected', reason: 'invalid_params' };
	}

	const { data, error } = await supabaseAdmin.rpc('upsert_rig_stats', {
		p_rig_id: rigId,
		p_timeout_minutes: parseInt(SESSION_TIMEOUT_MINS),
		p_kind: kind,
		p_stats: parsed.data
	});
	if (error) throw error;

	if (data === 'ok' || data === 'ignored') return { status: data };
	throw new Error(`upsert_rig_stats returned an unexpected value: ${data}`);
}
