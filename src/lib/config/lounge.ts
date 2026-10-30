// Lounge tuning (Sprint 1.5, Decision 7): UX constants, the same in every deployment.

// A lap of the current session at most this old at load time freezes the live lap card.
export const FREEZE_WINDOW_S = 20;

// How long the frozen lap stays on the live lap card before the live lap returns.
export const FREEZE_DURATION_S = 5;

// "On pace": within this fraction of the session best (0.01 = 1%). Sectors and laps alike.
export const PACE_BAND = 0.01;

// Sim session / live lap stats older than this show "Updated n min ago".
export const STATS_STALE_AFTER_S = 120;
