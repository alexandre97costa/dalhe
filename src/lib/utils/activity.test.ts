import { describe, expect, it } from 'vitest';
import { activityRowState, cursorFilter, mergeFirstPage, paginate } from './activity';

// Laps newest first, as the feed orders them: lapId n created n minutes after a fixed start.
const lap = (
	lapId: number,
	createdAt = new Date(Date.UTC(2026, 10, 17, 0, lapId)).toISOString()
) => ({
	lapId,
	createdAt
});
const newestFirst = (from: number, to: number) => {
	const laps = [];
	for (let id = from; id >= to; id--) laps.push(lap(id));
	return laps;
};

describe('activityRowState', () => {
	it('a track record wins over a personal best', () => {
		expect(activityRowState({ isTrackRecord: true, isPersonalBest: true })).toEqual({
			kind: 'record',
			showDelta: false
		});
	});

	it('a personal best', () => {
		expect(activityRowState({ isTrackRecord: false, isPersonalBest: true })).toEqual({
			kind: 'personalBest',
			showDelta: false
		});
	});

	it('a plain upload shows the delta', () => {
		expect(activityRowState({ isTrackRecord: false, isPersonalBest: false })).toEqual({
			kind: 'upload',
			showDelta: true
		});
	});
});

describe('paginate', () => {
	it('a full page plus one: has more, cursor at the last row shown', () => {
		const rows = newestFirst(21, 1);
		const { laps, nextCursor } = paginate(rows, 20);
		expect(laps).toHaveLength(20);
		expect(laps.at(-1)?.lapId).toBe(2);
		expect(nextCursor).toEqual({ lapId: 2, createdAt: rows[19].createdAt });
	});

	it('exactly a page: the last page', () => {
		const { laps, nextCursor } = paginate(newestFirst(20, 1), 20);
		expect(laps).toHaveLength(20);
		expect(nextCursor).toBeNull();
	});

	it('less than a page and empty: the last page', () => {
		expect(paginate(newestFirst(3, 1), 20)).toEqual({ laps: newestFirst(3, 1), nextCursor: null });
		expect(paginate([], 20)).toEqual({ laps: [], nextCursor: null });
	});
});

describe('cursorFilter', () => {
	it('strictly after the cursor in (created_at, lap_id) desc order, timestamp quoted', () => {
		expect(cursorFilter({ createdAt: '2026-11-17T10:00:00.123456+00:00', lapId: 42 })).toBe(
			'created_at.lt."2026-11-17T10:00:00.123456+00:00",and(created_at.eq."2026-11-17T10:00:00.123456+00:00",lap_id.lt.42)'
		);
	});
});

describe('mergeFirstPage', () => {
	const page = (laps: { lapId: number; createdAt: string }[], next: number | null) => ({
		laps,
		nextCursor: next === null ? null : { lapId: next, createdAt: lap(next).createdAt }
	});

	it('one page loaded: takes the fresh page', () => {
		const fresh = page(newestFirst(25, 6), 6);
		expect(mergeFirstPage(page(newestFirst(20, 1), 1), fresh)).toBe(fresh);
	});

	it('two pages loaded, a few new laps: fresh on top, no duplicates, old cursor kept', () => {
		const current = page(newestFirst(40, 1), 1);
		const merged = mergeFirstPage(current, page(newestFirst(43, 24), 24));
		expect(merged.laps.map((l) => l.lapId)).toEqual(newestFirst(43, 1).map((l) => l.lapId));
		expect(merged.nextCursor).toEqual(current.nextCursor);
	});

	it('more than a page of new laps (no overlap): resets to the fresh page', () => {
		const fresh = page(newestFirst(80, 61), 61);
		expect(mergeFirstPage(page(newestFirst(40, 1), 1), fresh)).toBe(fresh);
	});

	it('the fresh page is the whole list: takes it', () => {
		const fresh = page(newestFirst(15, 1), null);
		expect(mergeFirstPage(page(newestFirst(40, 21), 21), fresh)).toBe(fresh);
	});
});
