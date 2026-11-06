import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	disconnectFromRig,
	getLoungeBests,
	getRigStatus,
	getRigStats,
	getSessionLaps,
	getSimMapping,
	getUnclaimedLaps,
	hasRigAssociation
} from '$lib/queries/rig';
import { dismissTip, getDismissedTips } from '$lib/queries/tips';
import { isTipKey } from '$lib/config/tips';
import { bestsFor } from '$lib/pace';
import type { TypedSupabaseClient } from '$lib/types/supabase';
import type { LoungePageData, LoungeSessionData, LoungeTips } from '$lib/types/lounge';

// Milliseconds since an ISO timestamp, on the server clock; never negative. Null in, null out.
function ageMs(timestamp: string | null, now: number): number | null {
	if (!timestamp) return null;
	return Math.max(0, now - Date.parse(timestamp));
}

// What the three cards show without an active session.
const NO_SESSION: LoungeSessionData = {
	simSession: null,
	liveLap: null,
	statsUpdatedAt: { simSession: null, liveLap: null },
	statsAgeMs: { simSession: null, liveLap: null },
	simMapping: null,
	bests: {},
	liveBests: null,
	sessionLaps: [],
	sessionLapCount: 0,
	latestLap: null
};

// The active session's stats, laps and bests. Streamed: the page renders before this resolves.
async function loadSession(
	supabase: TypedSupabaseClient,
	rigId: string,
	sessionId: string
): Promise<LoungeSessionData> {
	const [stats, session] = await Promise.all([
		getRigStats(supabase, rigId),
		getSessionLaps(supabase, sessionId)
	]);

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

	// After the queries, so the ages the freeze frame reads are as of what the page receives.
	const now = Date.now();
	const latest = session.laps[0];

	return {
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
		latestLap: latest ? { ...latest, ageMs: ageMs(latest.createdAt, now) ?? 0 } : null
	};
}

// Which tips the lounge shows. "Saved to your homepage": the user has at least one rig and
// hasn't dismissed it (Sprint 2, Decision 10).
async function loadTips(supabase: TypedSupabaseClient, userId: string): Promise<LoungeTips> {
	const [hasRig, dismissed] = await Promise.all([
		hasRigAssociation(supabase, userId),
		getDismissedTips(supabase, userId)
	]);
	return { rigSaved: hasRig && !dismissed.includes('rig_saved') };
}

// The contract is LoungePageData ($lib/types/lounge.ts, docs/sprints/lounge-brief.md).
export const load: PageServerLoad = async ({ locals, params }): Promise<LoungePageData> => {
	const { supabase, safeGetSession } = locals;
	const { user } = await safeGetSession();

	const [status, tips] = await Promise.all([
		getRigStatus(supabase, params.slug),
		user ? loadTips(supabase, user.id) : Promise.resolve<LoungeTips>({ rigSaved: false })
	]);
	if (!status) {
		throw error(404, 'Rig not found');
	}

	// Stats and session laps belong to the active session; without one they are empty.
	const sessionId = status.session_active ? status.session_id : null;

	const session = sessionId
		? loadSession(supabase, status.rig_id, sessionId)
		: Promise.resolve(NO_SESSION);
	const unclaimedLaps = getUnclaimedLaps(supabase, status.rig_id);

	// Marks the rejections as handled: one that lands before SvelteKit starts streaming would
	// otherwise crash the server as unhandled. The page still sees it on the promises it gets.
	session.catch(() => {});
	unclaimedLaps.catch(() => {});

	return {
		rig: { id: status.rig_id, name: status.rig_name },
		status,
		isDriver: !!user && status.session_active && status.driver_id === user.id,
		tips,
		session,
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
	},

	// Dismisses a tip for the user (stored per user, so it stays dismissed on every device).
	dismissTip: async ({ locals: { supabase, safeGetSession }, request }) => {
		const { user } = await safeGetSession();
		if (!user) {
			return fail(401, { dismissedTip: null });
		}

		const tipKey = (await request.formData()).get('tip_key');
		if (!isTipKey(tipKey)) {
			return fail(400, { dismissedTip: null });
		}

		await dismissTip(supabase, user.id, tipKey);
		return { dismissedTip: tipKey };
	}
};
