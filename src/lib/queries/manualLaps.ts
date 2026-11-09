// queries for manual laps, the fallback for when the SimHub overlay can't send laps
// (public.app_settings switch, public.insert_manual_lap)

import { GET_TEST_RECORDS } from '$env/static/private';
import type { TypedSupabaseClient } from '$lib/types/supabase';

// Whether the "Add lap" link and /new are on. False when the setting can't be read,
// so a failed read hides the fallback instead of breaking every page.
export async function getManualLapsEnabled(supabaseClient: TypedSupabaseClient): Promise<boolean> {
	const { data, error } = await supabaseClient
		.from('app_settings')
		.select('manual_laps_enabled')
		.maybeSingle();
	if (error) {
		console.error('Reading app_settings failed:', error.message);
		return false;
	}
	return data?.manual_laps_enabled ?? false;
}

// Everything the form's pickers need.
export async function getManualLapCatalog(supabaseClient: TypedSupabaseClient) {
	const [games, tracks, makes, cars] = await Promise.all([
		supabaseClient.from('game').select('id, name').order('name'),
		supabaseClient.from('race_track').select('id, name').order('name'),
		supabaseClient.from('car_make').select('id, name').order('name'),
		supabaseClient.from('car').select('id, make_id, model, year').order('model')
	]);
	for (const result of [games, tracks, makes, cars]) {
		if (result.error) throw result.error;
	}

	return {
		games: games.data ?? [],
		tracks: tracks.data ?? [],
		makes: makes.data ?? [],
		cars: cars.data ?? []
	};
}

export type ManualLapStatus = 'created' | 'duplicate' | 'disabled' | 'sectors_mismatch';

export type ManualLap = {
	gameId: number;
	trackId: number;
	carId: number;
	lapMs: number;
	// All three or none
	sectorsMs: [number, number, number] | null;
};

// Stores a lap for the logged-in user (the database takes the driver from the login).
// Throws on database errors, e.g. an unknown car or track.
export async function insertManualLap(
	supabaseClient: TypedSupabaseClient,
	lap: ManualLap
): Promise<ManualLapStatus> {
	const { data, error } = await supabaseClient.rpc('insert_manual_lap', {
		p_game_id: lap.gameId,
		p_track_id: lap.trackId,
		p_car_id: lap.carId,
		p_lap_time_ms: lap.lapMs,
		p_s1_ms: lap.sectorsMs?.[0],
		p_s2_ms: lap.sectorsMs?.[1],
		p_s3_ms: lap.sectorsMs?.[2],
		p_for_testing: GET_TEST_RECORDS === 'true'
	});
	if (error) throw error;

	const status = data[0]?.status;
	if (
		status === 'created' ||
		status === 'duplicate' ||
		status === 'disabled' ||
		status === 'sectors_mismatch'
	) {
		return status;
	}
	throw new Error(`insert_manual_lap returned an unexpected row: ${JSON.stringify(data[0])}`);
}
