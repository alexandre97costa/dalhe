// the query for the homepage data
// the most recent laptimes, no matter the track or car
// can be filtered by car category (and soon™ by All|Friends)

import type { TypedSupabaseClient } from '$lib/types/supabase';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js';
import type { RecentLaptime } from '../types/listings';
import { SESSION_TIMEOUT_MINS } from '$env/static/private';
import type { ActivityCursor, ActivityLap, ActivityPage } from '$lib/types/home';
import { ACTIVITY_PAGE_SIZE, cursorFilter, paginate } from '$lib/utils/activity';

export async function getRecentLaptimes(supabaseClient: TypedSupabaseClient) {
	const { data, error } = await supabaseClient
		.from('listing_recent_laptimes')
		.select('*')
		.order('created_at', { ascending: false });
	if (error) throw error;

	return data;
}

// One page of the homepage Activity feed, newest first, keyset paginated on
// (created_at, lap_id) so laps landing while someone reads never repeat or skip rows.
// The view's window columns (previous lap, personal best, record) are computed over all laps,
// so later pages are as correct as the first.
export async function getActivity(
	supabaseClient: TypedSupabaseClient,
	{ before }: { before?: ActivityCursor } = {}
): Promise<ActivityPage> {
	let query = supabaseClient.from('listing_recent_laptimes').select('*');
	if (before) query = query.or(cursorFilter(before));
	const { data, error } = await query
		.order('created_at', { ascending: false })
		.order('lap_id', { ascending: false })
		.limit(ACTIVITY_PAGE_SIZE + 1);
	if (error) throw error;

	const { laps: rows, nextCursor } = paginate(
		data.map((row) => ({ ...row, createdAt: row.created_at, lapId: row.lap_id }))
	);

	// Which of this page's sessions are still live, and on which rig (same expiry rule and
	// timeout as the rig card).
	const sessionIds = [...new Set(rows.flatMap((row) => (row.session_id ? [row.session_id] : [])))];
	const activeRigBySession = new Map<string, string>();
	if (sessionIds.length > 0) {
		const { data: active, error: activeError } = await supabaseClient.rpc('active_lap_sessions', {
			p_session_ids: sessionIds,
			p_expiry_minutes: parseInt(SESSION_TIMEOUT_MINS)
		});
		if (activeError) throw activeError;
		for (const row of active) activeRigBySession.set(row.session_id, row.rig_id);
	}

	const laps = rows.map(
		(row): ActivityLap => ({
			lapId: row.lap_id,
			createdAt: row.created_at,
			driverId: row.driverid,
			driverName: row.driver ?? '',
			driverAvatarUrl: row.driver_avatar_url,
			trackId: row.trackid,
			trackName: row.track_name,
			carMake: row.car_make,
			carModel: row.car_model,
			laptime: row.laptime,
			previousLaptime: row.previous_laptime,
			isPersonalBest: row.is_personal_best ?? false,
			isTrackRecord: row.is_track_record ?? false,
			activeRigId: (row.session_id && activeRigBySession.get(row.session_id)) ?? null
		})
	);
	return { laps, nextCursor };
}
