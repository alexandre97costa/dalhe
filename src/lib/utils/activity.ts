// Pure helpers for the homepage Activity feed (unit tested in activity.test.ts).

import type { ActivityCursor, ActivityLap } from '$lib/types/home';

export const ACTIVITY_PAGE_SIZE = 60;
// Laps a group lists before "Show all".
export const ACTIVITY_GROUP_PREVIEW = 5;

export type ActivityKind = 'record' | 'personalBest' | 'upload';

// What a row says: a track record wins over a personal best (as in RecentEntry). Only a plain
// upload shows the delta against the driver's previous lap on the track.
export function activityRowState(lap: Pick<ActivityLap, 'isTrackRecord' | 'isPersonalBest'>): {
	kind: ActivityKind;
	showDelta: boolean;
} {
	const kind: ActivityKind = lap.isTrackRecord
		? 'record'
		: lap.isPersonalBest
			? 'personalBest'
			: 'upload';
	return { kind, showDelta: kind === 'upload' };
}

type Groupable = {
	lapId: number;
	sessionId: string | null;
	driverId: string;
	trackId: number;
	carId: number;
};

// The laps of one stint share a key: same session, driver, track and car. A lap without a
// session (typed in by hand) is its own group.
export function activityGroupKey(lap: Groupable): string {
	return lap.sessionId
		? `${lap.sessionId}:${lap.driverId}:${lap.trackId}:${lap.carId}`
		: `lap:${lap.lapId}`;
}

// Groups the feed's laps (newest first) by key, across the whole loaded list: two rigs driven
// at once interleave their laps in time, and grouping only neighbours would break each stint
// into single laps. A group sits where its newest lap is; its laps stay newest first.
export function groupActivity<T extends Groupable>(laps: T[]): { key: string; laps: T[] }[] {
	const groups = new Map<string, T[]>();
	for (const lap of laps) {
		const key = activityGroupKey(lap);
		const group = groups.get(key);
		if (group) group.push(lap);
		else groups.set(key, [lap]);
	}
	return [...groups].map(([key, laps]) => ({ key, laps }));
}

// What a group says as a whole: its fastest lap, and the strongest kind among its laps
// (a record anywhere tints the card purple, else a personal best yellow).
export function activityGroupSummary<
	T extends { laptime: number; isTrackRecord: boolean; isPersonalBest: boolean }
>(laps: T[]): { best: T; kind: ActivityKind } {
	const best = laps.reduce((a, b) => (b.laptime < a.laptime ? b : a));
	const kind: ActivityKind = laps.some((lap) => lap.isTrackRecord)
		? 'record'
		: laps.some((lap) => lap.isPersonalBest)
			? 'personalBest'
			: 'upload';
	return { best, kind };
}

// Rows come in fetched with one extra (pageSize + 1) to learn whether there is a next page.
// Returns the page and the cursor after its last row, or null when this is the last page.
export function paginate<T extends { createdAt: string; lapId: number }>(
	rows: T[],
	pageSize: number = ACTIVITY_PAGE_SIZE
): { laps: T[]; nextCursor: ActivityCursor | null } {
	const laps = rows.slice(0, pageSize);
	const last = laps.at(-1);
	const nextCursor =
		rows.length > pageSize && last ? { createdAt: last.createdAt, lapId: last.lapId } : null;
	return { laps, nextCursor };
}

// PostgREST `or` filter for the rows strictly after the cursor in (created_at, lap_id) desc
// order. The timestamp is quoted: it contains ':' and '+'.
export function cursorFilter(cursor: ActivityCursor): string {
	const at = `"${cursor.createdAt}"`;
	return `created_at.lt.${at},and(created_at.eq.${at},lap_id.lt.${cursor.lapId})`;
}

// After a refresh (coming back to the tab), the fresh first page goes on top of the laps
// already loaded, without duplicates, keeping the loaded pages and their cursor. When the
// fresh page doesn't reach the old list (more than a page of new laps), there would be a
// gap, so the list resets to the fresh page.
export function mergeFirstPage<T extends { lapId: number }>(
	current: { laps: T[]; nextCursor: ActivityCursor | null },
	fresh: { laps: T[]; nextCursor: ActivityCursor | null }
): { laps: T[]; nextCursor: ActivityCursor | null } {
	const freshIds = new Set(fresh.laps.map((lap) => lap.lapId));
	const overlaps = current.laps.some((lap) => freshIds.has(lap.lapId));
	// Nothing loaded beyond page 1, no overlap, or the fresh page is the whole list: take it.
	if (!overlaps || current.laps.length <= fresh.laps.length || !fresh.nextCursor) return fresh;

	const rest = current.laps.filter((lap) => !freshIds.has(lap.lapId));
	return { laps: [...fresh.laps, ...rest], nextCursor: current.nextCursor };
}
