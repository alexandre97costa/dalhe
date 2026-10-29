// queries for one rig: its status and what the lounge room shows

import type { TypedSupabaseClient } from '$lib/types/supabase';
import { GET_TEST_RECORDS, SESSION_TIMEOUT_MINS } from '$env/static/private';
import type { RigStatus } from '$lib/server/rigs';
import type { SessionStats, LapStats } from '$lib/types/rig';
import * as z from 'zod';

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

// The laps of one rig session, newest first.
export async function getSessionLaps(supabaseClient: TypedSupabaseClient, sessionId: string) {
	const { data, error } = await supabaseClient
		.from('lap_time')
		.select(loungeLapSelect)
		.eq('session_id', sessionId)
		.eq('for_testing', GET_TEST_RECORDS === 'true')
		.order('created_at', { ascending: false })
		.limit(100);
	if (error) throw error;

	return data;
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

export type LoungeLap = Awaited<ReturnType<typeof getSessionLaps>>[number];

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
