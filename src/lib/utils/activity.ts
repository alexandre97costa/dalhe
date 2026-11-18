// Pure helpers for the homepage Activity feed (unit tested in activity.test.ts).

import type { ActivityCursor, ActivityLap } from '$lib/types/home';

export const ACTIVITY_PAGE_SIZE = 20;

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
