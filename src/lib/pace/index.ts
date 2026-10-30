// The lounge's pace colour ladder (Sprint 1.5, Decision 1). Components never compare
// times themselves: they call classifyPace with the bests the load gives them.
// Pure: no Svelte, no Paraglide (labels are in ./labels).

import { PACE_BAND } from '$lib/config/lounge';

// First match wins: record (≤ app-wide best), sessionBest (≤ session best),
// onPace (≤ session best × (1 + PACE_BAND)), offPace (anything else).
// neutral: no time, or no best to compare with.
export type Pace = 'record' | 'sessionBest' | 'onPace' | 'offPace' | 'neutral';

// What is being compared: the lap time or one sector.
export type PaceKind = 'lap' | 's1' | 's2' | 's3';

// Best times in ms, one per kind. Null when there is nothing to compare with.
export type BestTimes = Record<PaceKind, number | null>;

// The bests for one track + car category (one get_lounge_bests row).
export type LoungeBests = {
	trackId: number;
	categoryId: number;
	// App-wide (laps with a driver, not dismissed, same test flag): purple.
	record: BestTimes;
	// The current session: blue, and the base of the green band. Null bests without a session.
	session: BestTimes;
};

// Key of the bests map: `${trackId}:${categoryId}`, e.g. "3:1".
export type BestsKey = `${number}:${number}`;
export type BestsByKey = Partial<Record<BestsKey, LoungeBests>>;

export function bestsKey(trackId: number, categoryId: number): BestsKey {
	return `${trackId}:${categoryId}`;
}

// The bests for a lap (or the live track + category). Null when the ids are missing
// (unmapped) or the map has no row for them: everything is then neutral.
export function bestsFor(
	bests: BestsByKey,
	ids: { trackId: number | null; categoryId: number | null } | null | undefined
): LoungeBests | null {
	if (!ids || ids.trackId === null || ids.categoryId === null) return null;
	return bests[bestsKey(ids.trackId, ids.categoryId)] ?? null;
}

// Classifies one lap time or sector time against its bests. Ties use ≤ (both get the colour).
// - null/undefined time, or no bests: neutral;
// - ≤ app-wide best: record (even without a session best);
// - no session best: neutral (never offPace without something to compare with);
// - ≤ session best: sessionBest; ≤ session best × (1 + band): onPace; else offPace.
export function classifyPace(
	time: number | null | undefined,
	bests: LoungeBests | null | undefined,
	kind: PaceKind,
	band: number = PACE_BAND
): Pace {
	if (time === null || time === undefined || !bests) return 'neutral';

	const record = bests.record[kind];
	if (record !== null && time <= record) return 'record';

	const session = bests.session[kind];
	if (session === null) return 'neutral';
	if (time <= session) return 'sessionBest';
	// The epsilon keeps the edge inclusive despite float maths (100000 × 1.01 is not exact).
	if (time <= session * (1 + band) + 1e-6) return 'onPace';
	return 'offPace';
}

// Paces that carry a badge or crown on laps (offPace and neutral carry none).
export function hasPaceBadge(pace: Pace): pace is 'record' | 'sessionBest' | 'onPace' {
	return pace === 'record' || pace === 'sessionBest' || pace === 'onPace';
}

// The fields of a lap that classifyLap needs (SessionLap has them all).
export type PaceableLap = {
	timeMs: number | null;
	s1Ms: number | null;
	s2Ms: number | null;
	s3Ms: number | null;
	trackId: number | null;
	categoryId: number | null;
};

// The pace of a lap and each of its sectors, against the bests of its own track + category.
export function classifyLap(lap: PaceableLap, bests: BestsByKey): Record<PaceKind, Pace> {
	const own = bestsFor(bests, lap);
	return {
		lap: classifyPace(lap.timeMs, own, 'lap'),
		s1: classifyPace(lap.s1Ms, own, 's1'),
		s2: classifyPace(lap.s2Ms, own, 's2'),
		s3: classifyPace(lap.s3Ms, own, 's3')
	};
}
