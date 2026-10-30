// The lounge load contract (Sprint 1.5, F1). Documented in docs/sprints/lounge-brief.md.
// The UI streams (live lap, session laps, session card) build only from this.

import type { BestsByKey, LoungeBests } from '$lib/pace';
import type { RigStatus } from '$lib/server/rigs';
import type { LapStats, SessionStats } from '$lib/types/rig';
import type { LoungeLap, SessionLap, SimMapping } from '$lib/queries/rig';

export type { BestsByKey, BestsKey, LoungeBests, BestTimes, Pace, PaceKind } from '$lib/pace';
export type { LoungeLap, SessionLap, SimMapping } from '$lib/queries/rig';

// The newest lap of the active session, plus its age when the page loaded.
export type LatestLap = SessionLap & {
	// ms between the lap's created_at and the load (server clock), ≥ 0. Freeze when ≤ FREEZE_WINDOW_S × 1000.
	ageMs: number;
};

export type LoungePageData = {
	rig: { id: string; name: string };
	status: RigStatus;
	// The viewer drives the active session (shows Disconnect).
	isDriver: boolean;

	// Latest stats from the overlay, SimHub field names. Null without an active session or before the
	// first send.
	simSession: SessionStats | null;
	liveLap: LapStats | null;
	// ISO timestamps of the last /send/session and /send/live.
	statsUpdatedAt: { simSession: string | null; liveLap: string | null };
	// Age of those stats at load time in ms (server clock), ≥ 0. Null when there are no stats.
	statsAgeMs: { simSession: number | null; liveLap: number | null };

	// simSession's TrackId / CarId mapped to the catalog. Null without simSession.
	simMapping: SimMapping | null;

	// Bests per track + category (key `${trackId}:${categoryId}`): every combination in the session's
	// laps plus the live one. Look laps up with bestsFor(bests, lap) from $lib/pace.
	bests: BestsByKey;
	// The bests of the live track + category (simMapping). Null when unmapped or without simSession.
	liveBests: LoungeBests | null;

	// The active session's laps, newest first, capped at 100. Empty without an active session.
	sessionLaps: SessionLap[];
	// All laps of the active session (the cap doesn't apply), 0 without one.
	sessionLapCount: number;
	// sessionLaps[0] with its age. Null without an active session or laps.
	latestLap: LatestLap | null;

	// The rig's laps with no driver and not dismissed, newest first, capped at 50 (unchanged shape).
	unclaimedLaps: LoungeLap[];
};
