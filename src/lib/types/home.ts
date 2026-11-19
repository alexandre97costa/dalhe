// The homepage rig card (Sprint 2, S2). Built by getMyRigs in $lib/queries/rig.ts.

// One rig the user has connected to or spectated, with its status at load time.
export type MyRig = {
	id: string;
	name: string;
	// An open session active within SESSION_TIMEOUT_MINS (same rule as rig_status).
	sessionActive: boolean;
	// The driver's username; null when free or anonymous.
	driverName: string | null;
	// The driver's avatar; null when free, anonymous or the driver has none.
	driverAvatarUrl: string | null;
	// The user drives the active session (the red carpet).
	driverIsMe: boolean;
	// Active session with no driver: laps are landing unclaimed.
	isAnonymous: boolean;
	// ISO timestamp: the later of the user's last connect and last spectate.
	lastUsedAt: string | null;
};

export type HomeRigs = {
	// The rig the user is driving, if any. Shown first, never also in `others`.
	driving: MyRig | null;
	// Every other rig: live first, then most recently used. Empty is a state, not an error.
	others: MyRig[];
};

// The homepage Activity feed (newest laps first, keyset paginated). Built by getActivity in
// $lib/queries/homepage.ts.

// Where the next page starts: the last lap shown, ordered by (created_at, lap_id) desc.
export type ActivityCursor = { createdAt: string; lapId: number };

// One lap of the feed. The view's columns, plus the rig whose active session it was driven in.
export type ActivityLap = {
	lapId: number;
	createdAt: string;
	driverId: string;
	driverName: string;
	driverAvatarUrl: string | null;
	// The lap's session; null for a lap typed in by hand (never grouped).
	sessionId: string | null;
	trackId: number;
	trackName: string;
	carId: number;
	carMake: string;
	carModel: string;
	laptime: number;
	previousLaptime: number | null;
	isPersonalBest: boolean;
	isTrackRecord: boolean;
	// The rig, when the lap's session is still that rig's active session ("View session").
	activeRigId: string | null;
};

// Laps of one session by one driver on the same track and car, newest first. A group of
// one is a single lap. Built by groupActivity in $lib/utils/activity.ts.
export type ActivityGroup = { key: string; laps: ActivityLap[] };

export type ActivityPage = {
	laps: ActivityLap[];
	// Null on the last page.
	nextCursor: ActivityCursor | null;
};
