// queries for one rig: its status and what the lounge room shows

import type { TypedSupabaseClient } from '$lib/types/supabase';
import { GET_TEST_RECORDS, SESSION_TIMEOUT_MINS } from '$env/static/private';
import type { RigStatus } from '$lib/server/rigs';
import type { SessionStats, LapStats } from '$lib/types/rig';
import * as z from 'zod';
import { bestsKey, type BestsByKey } from '$lib/pace';
import { humanizeSimhubId } from '$lib/utils/simhub';

// Who is driving, with lazy expiry: an expired session reports as inactive.
// Null for an unknown rig or a malformed id.
export async function getRigStatus(
	supabaseClient: TypedSupabaseClient,
	rigId: string
): Promise<RigStatus | null> {
	if (!z.uuid().safeParse(rigId).success) return null;

	const { data, error } = await supabaseClient.rpc('rig_status', {
		p_rig_id: rigId,
		p_expiry_minutes: parseInt(SESSION_TIMEOUT_MINS)
	});
	if (error) throw error;

	return data?.[0] ?? null;
}

export type RigStats = {
	simSession: SessionStats | null;
	simSessionUpdatedAt: string | null;
	liveLap: LapStats | null;
	liveLapUpdatedAt: string | null;
};

// The latest stats the overlay sent. Only meaningful while a session is active, so the
// caller skips this when there is none.
export async function getRigStats(
	supabaseClient: TypedSupabaseClient,
	rigId: string
): Promise<RigStats | null> {
	const { data, error } = await supabaseClient
		.from('rig_stats')
		.select('session_stats, session_updated_at, lap_stats, lap_updated_at')
		.eq('id', rigId)
		.maybeSingle();
	if (error) throw error;
	if (!data) return null;

	// The json shapes are whatever /send/session and /send/live stored (validated there).
	return {
		simSession: data.session_stats as SessionStats | null,
		simSessionUpdatedAt: data.session_updated_at,
		liveLap: data.lap_stats as LapStats | null,
		liveLapUpdatedAt: data.lap_updated_at
	};
}

const loungeLapSelect = `
	id,
	time_milliseconds,
	sector1_ms,
	sector2_ms,
	sector3_ms,
	created_at,
	driver:profiles!lap_time_driver_id_fkey1 ( username ),
	car ( model, car_make ( name ), car_category ( name ) ),
	race_track ( name )
` as const;

const sessionLapSelect = `
	id,
	time_milliseconds,
	sector1_ms,
	sector2_ms,
	sector3_ms,
	created_at,
	track_id,
	car_id,
	driver:profiles!lap_time_driver_id_fkey1 ( username ),
	car ( model, category_id, car_make ( name ), car_category ( name ) ),
	race_track ( name )
` as const;

// One lap of the active session, flat, with everything the lounge needs to colour and group it.
export type SessionLap = {
	id: number;
	// Chronological number within the session: the oldest lap is 1 (counts laps past the cap too).
	lapNumber: number;
	timeMs: number;
	// Sector times in ms; null on legacy laps without sectors.
	s1Ms: number | null;
	s2Ms: number | null;
	s3Ms: number | null;
	createdAt: string;
	// Driver's username; null for an anonymous session.
	driverName: string | null;
	trackId: number;
	trackName: string;
	carId: number;
	carMake: string;
	carModel: string;
	// The car's category; null when the catalog car has none (no bests then).
	categoryId: number | null;
	categoryName: string | null;
};

// The laps of one rig session, newest first (at most 100), and how many there are in total.
export async function getSessionLaps(
	supabaseClient: TypedSupabaseClient,
	sessionId: string
): Promise<{ laps: SessionLap[]; total: number }> {
	const { data, error, count } = await supabaseClient
		.from('lap_time')
		.select(sessionLapSelect, { count: 'exact' })
		.eq('session_id', sessionId)
		.eq('for_testing', GET_TEST_RECORDS === 'true')
		.order('created_at', { ascending: false })
		.order('id', { ascending: false })
		.limit(100);
	if (error) throw error;

	const total = count ?? data.length;
	const laps = data.map((lap, index) => ({
		id: lap.id,
		lapNumber: total - index,
		timeMs: lap.time_milliseconds,
		s1Ms: lap.sector1_ms,
		s2Ms: lap.sector2_ms,
		s3Ms: lap.sector3_ms,
		createdAt: lap.created_at,
		driverName: lap.driver?.username ?? null,
		trackId: lap.track_id,
		trackName: lap.race_track.name,
		carId: lap.car_id,
		carMake: lap.car.car_make.name,
		carModel: lap.car.model,
		categoryId: lap.car.category_id,
		categoryName: lap.car.car_category?.name ?? null
	}));
	return { laps, total };
}

// The sim session's SimHub ids mapped to the catalog (Sprint 1.5, Decision 4).
export type SimMapping = {
	// Catalog rows; null when the SimHub id isn't in the catalog.
	track: { id: number; name: string } | null;
	car: { id: number; make: string; model: string } | null;
	category: { id: number; name: string } | null;
	// What to show: the catalog name, or the humanized SimHub id when unmapped.
	// car is "Make Model" ("McLaren 720S Evo"); category is null when the car is unmapped.
	labels: { track: string; car: string; category: string | null };
};

// Maps SimHub's TrackId / CarId through race_track.simhub_trackid / car.simhub_carid (both unique).
export async function getSimMapping(
	supabaseClient: TypedSupabaseClient,
	simhubTrackId: string,
	simhubCarId: string
): Promise<SimMapping> {
	const [trackResult, carResult] = await Promise.all([
		supabaseClient
			.from('race_track')
			.select('id, name')
			.eq('simhub_trackid', simhubTrackId)
			.maybeSingle(),
		supabaseClient
			.from('car')
			.select('id, model, car_make ( name ), car_category ( id, name )')
			.eq('simhub_carid', simhubCarId)
			.maybeSingle()
	]);
	if (trackResult.error) throw trackResult.error;
	if (carResult.error) throw carResult.error;

	const track = trackResult.data;
	const carRow = carResult.data;
	const car = carRow ? { id: carRow.id, make: carRow.car_make.name, model: carRow.model } : null;
	const category = carRow?.car_category
		? { id: carRow.car_category.id, name: carRow.car_category.name }
		: null;

	return {
		track,
		car,
		category,
		labels: {
			track: track?.name ?? humanizeSimhubId(simhubTrackId) ?? simhubTrackId,
			car: car ? `${car.make} ${car.model}` : (humanizeSimhubId(simhubCarId) ?? simhubCarId),
			category: category?.name ?? null
		}
	};
}

// Bests per track + category for the session's laps plus the live combination (get_lounge_bests).
// sessionId null: only the live combination, without session bests.
export async function getLoungeBests(
	supabaseClient: TypedSupabaseClient,
	sessionId: string | null,
	live: { trackId: number; categoryId: number } | null
): Promise<BestsByKey> {
	if (!sessionId && !live) return {};

	const { data, error } = await supabaseClient.rpc('get_lounge_bests', {
		// The generated types say string/number, but the rpc takes null for "none".
		p_session_id: sessionId as string,
		p_track_id: (live?.trackId ?? null) as number,
		p_category_id: (live?.categoryId ?? null) as number,
		p_testing: GET_TEST_RECORDS === 'true'
	});
	if (error) throw error;

	const bests: BestsByKey = {};
	for (const row of data ?? []) {
		bests[bestsKey(row.track_id, row.category_id)] = {
			trackId: row.track_id,
			categoryId: row.category_id,
			record: {
				lap: row.record_lap_ms,
				s1: row.record_s1_ms,
				s2: row.record_s2_ms,
				s3: row.record_s3_ms
			},
			session: {
				lap: row.session_lap_ms,
				s1: row.session_s1_ms,
				s2: row.session_s2_ms,
				s3: row.session_s3_ms
			}
		};
	}
	return bests;
}

// Laps driven on the rig with nobody connected, not yet claimed or dismissed, newest first.
export async function getUnclaimedLaps(supabaseClient: TypedSupabaseClient, rigId: string) {
	const { data, error } = await supabaseClient
		.from('lap_time')
		.select(loungeLapSelect)
		.eq('rig_id', rigId)
		.is('driver_id', null)
		.is('dismissed_at', null)
		.eq('for_testing', GET_TEST_RECORDS === 'true')
		.order('created_at', { ascending: false })
		.limit(50);
	if (error) throw error;

	return data;
}

export type LoungeLap = Awaited<ReturnType<typeof getUnclaimedLaps>>[number];

export type ConnectResult = 'connected' | 'driver_changed';

// Connects the logged-in user (the rpc takes them from auth.uid()). `expectedDriverId` is the
// driver the page showed, or null; if someone else connected since, nothing changes and the
// result is 'driver_changed'.
export async function connectToRig(
	supabaseClient: TypedSupabaseClient,
	rigId: string,
	expectedDriverId: string | null
): Promise<ConnectResult> {
	const { data, error } = await supabaseClient.rpc('connect_to_rig', {
		p_rig_id: rigId,
		// The generated type says string, but the rpc takes null for "nobody was driving".
		p_expected_driver_id: expectedDriverId as string,
		p_timeout_minutes: parseInt(SESSION_TIMEOUT_MINS)
	});
	if (error) throw error;

	return data as ConnectResult;
}

// Closes the logged-in user's session on the rig. Returns the closed session id, or null when
// there was nothing of theirs to close (not the driver, stale tab, no session): a quiet no-op.
export async function disconnectFromRig(
	supabaseClient: TypedSupabaseClient,
	rigId: string
): Promise<string | null> {
	const { data, error } = await supabaseClient.rpc('disconnect_from_rig', {
		p_rig_id: rigId,
		p_timeout_minutes: parseInt(SESSION_TIMEOUT_MINS)
	});
	if (error) throw error;

	return data ?? null;
}
