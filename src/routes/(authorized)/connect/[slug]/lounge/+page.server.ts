import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	disconnectFromRig,
	getRigStatus,
	getRigStats,
	getSessionLaps,
	getUnclaimedLaps
} from '$lib/queries/rig';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { supabase, safeGetSession } = locals;
	const { user } = await safeGetSession();

	const status = await getRigStatus(supabase, params.slug);
	if (!status) {
		throw error(404, 'Rig not found');
	}

	// Stats and session laps belong to the active session; without one they are empty.
	const sessionId = status.session_active ? status.session_id : null;

	const [stats, sessionLaps, unclaimedLaps] = await Promise.all([
		sessionId ? getRigStats(supabase, status.rig_id) : null,
		sessionId ? getSessionLaps(supabase, sessionId) : [],
		getUnclaimedLaps(supabase, status.rig_id)
	]);

	return {
		rig: { id: status.rig_id, name: status.rig_name },
		status,
		isDriver: !!user && status.session_active && status.driver_id === user.id,
		simSession: stats?.simSession ?? null,
		liveLap: stats?.liveLap ?? null,
		statsUpdatedAt: {
			simSession: stats?.simSessionUpdatedAt ?? null,
			liveLap: stats?.liveLapUpdatedAt ?? null
		},
		// The newest lap of the session, for the new-lap banner.
		latestLap: sessionLaps[0] ?? null,
		sessionLaps,
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
