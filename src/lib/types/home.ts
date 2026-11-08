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
