// Copy for the pace ladder (Sprint 1.5, F5): one shared label map for badges and
// accessible labels. Kept apart from ./index so the pace logic stays pure.

import { m } from '$lib/paraglide/messages.js';
import type { Pace, PaceKind } from './index';

// Lap badges: record → "Track Record", sessionBest → "Session best", onPace → "On pace".
// Null for offPace and neutral (no badge).
export function paceLabel(pace: Pace): string | null {
	switch (pace) {
		case 'record':
			return m.lounge_pace_record();
		case 'sessionBest':
			return m.lounge_pace_session_best();
		case 'onPace':
			return m.lounge_pace_on_pace();
		default:
			return null;
	}
}

// Lower-case pace for accessible labels ("session best"), every pace included.
export function paceAriaLabel(pace: Pace): string {
	switch (pace) {
		case 'record':
			return m.lounge_pace_aria_record();
		case 'sessionBest':
			return m.lounge_pace_aria_session_best();
		case 'onPace':
			return m.lounge_pace_aria_on_pace();
		case 'offPace':
			return m.lounge_pace_aria_off_pace();
		default:
			return m.lounge_pace_aria_neutral();
	}
}

// Accessible label for a sector dot or tile: "S1: session best". `hasTime` false → "S1: no time".
export function sectorAriaLabel(
	kind: Exclude<PaceKind, 'lap'>,
	pace: Pace,
	hasTime = true
): string {
	return m.lounge_sector_aria({
		sector: kind.slice(1),
		pace: hasTime ? paceAriaLabel(pace) : m.lounge_pace_aria_no_time()
	});
}
