// Pure helpers for SessionCard.svelte (Sprint 1.5, stream C). No messages here: the card turns
// these values into copy.

import { STATS_STALE_AFTER_S } from '$lib/config/lounge';

// Decision 9: the open/closed state persists per viewer, the same on every rig.
export const SESSION_CARD_OPEN_KEY = 'dalhe.lounge.sessionCardOpen';

// Collapsed unless the viewer opened it before (C1).
export const SESSION_CARD_OPEN_DEFAULT = false;

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

// The stored choice, or the default when nothing (or something unreadable) is stored or the
// storage itself throws (private mode, blocked site data).
export function readSessionCardOpen(storage: StorageLike | null | undefined): boolean {
	try {
		const value = storage?.getItem(SESSION_CARD_OPEN_KEY);
		if (value === 'true') return true;
		if (value === 'false') return false;
	} catch {
		// Storage unavailable: fall through to the default.
	}
	return SESSION_CARD_OPEN_DEFAULT;
}

// Best effort: a failed write only means the choice isn't remembered.
export function writeSessionCardOpen(storage: StorageLike | null | undefined, open: boolean): void {
	try {
		storage?.setItem(SESSION_CARD_OPEN_KEY, String(open));
	} catch {
		// Storage unavailable: nothing to do.
	}
}

// Whole minutes since the stats were sent, when they are stale (C3); null when fresh or unknown.
export function staleMinutes(
	ageMs: number | null | undefined,
	staleAfterS: number = STATS_STALE_AFTER_S
): number | null {
	if (ageMs === null || ageMs === undefined || !Number.isFinite(ageMs)) return null;
	if (ageMs <= staleAfterS * 1000) return null;
	return Math.floor(ageMs / 60_000);
}

// TC and ABS: 0 means off ("Off" in the card); any other level is shown as is. Null when the
// value is missing, which the schema doesn't allow but old stats might.
export function assistLevel(level: number | null | undefined): 'off' | number | null {
	if (level === null || level === undefined || !Number.isFinite(level)) return null;
	return level === 0 ? 'off' : level;
}
