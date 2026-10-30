import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	disconnectFromRig,
	getLoungeBests,
	getRigStatus,
	getRigStats,
	getSessionLaps,
	getSimMapping,
	getUnclaimedLaps
} from '$lib/queries/rig';
import { bestsFor } from '$lib/pace';
import type { LoungePageData } from '$lib/types/lounge';

// Milliseconds since an ISO timestamp, on the server clock; never negative. Null in, null out.
function ageMs(timestamp: string | null, now: number): number | null {
	if (!timestamp) return null;
	return Math.max(0, now - Date.parse(timestamp));
}

// The contract is LoungePageData ($lib/types/lounge.ts, docs/sprints/lounge-brief.md).
export const load: PageServerLoad = async ({ locals, params }): Promise<LoungePageData> => {
	const { supabase, safeGetSession } = locals;
	const { user } = await safeGetSession();

	const status = await getRigStatus(supabase, params.slug);
	if (!status) {
		throw error(404, 'Rig not found');
	}

	// Stats and session laps belong to the active session; without one they are empty.
	const sessionId = status.session_active ? status.session_id : null;

	const [stats, session, unclaimedLaps] = await Promise.all([
		sessionId ? getRigStats(supabase, status.rig_id) : null,
		sessionId ? getSessionLaps(supabase, sessionId) : { laps: [], total: 0 },
		getUnclaimedLaps(supabase, status.rig_id)
	]);
	const now = Date.now();

	// SimHub ids → catalog track, car, category (null when unmapped), then the bests for the
	// session's laps plus the live combination.
	const simSession = stats?.simSession ?? null;
	const simMapping = simSession
		? await getSimMapping(supabase, simSession.TrackId, simSession.CarId)
		: null;
	const live =
		simMapping?.track && simMapping.category
			? { trackId: simMapping.track.id, categoryId: simMapping.category.id }
			: null;
	const bests = await getLoungeBests(supabase, sessionId, live);

	const latest = session.laps[0];

	return {
		rig: { id: status.rig_id, name: status.rig_name },
		status,
		isDriver: !!user && status.session_active && status.driver_id === user.id,
		simSession,
		liveLap: stats?.liveLap ?? null,
		statsUpdatedAt: {
			simSession: stats?.simSessionUpdatedAt ?? null,
			liveLap: stats?.liveLapUpdatedAt ?? null
		},
		statsAgeMs: {
			simSession: ageMs(stats?.simSessionUpdatedAt ?? null, now),
			liveLap: ageMs(stats?.liveLapUpdatedAt ?? null, now)
		},
		simMapping,
		bests,
		liveBests: bestsFor(bests, live),
		sessionLaps: session.laps,
		sessionLapCount: session.total,
		latestLap: latest ? { ...latest, ageMs: ageMs(latest.createdAt, now) ?? 0 } : null,
		unclaimedLaps
	};
};

export const actions: Actions = {
	disconnect: async ({ locals: { supabase }, params }) => {
		const status = await getRigStatus(supabase, params.slug);
		if (!status) {
			throw error(404, 'Rig not found');
		}

		// Null when the caller wasn't driving (stale tab, someone took over): nothing to report.
		const closedSessionId = await disconnectFromRig(supabase, status.rig_id);
		return { disconnected: closedSessionId !== null };
	}
};
