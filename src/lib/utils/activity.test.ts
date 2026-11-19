import { describe, expect, it } from 'vitest';
import {
	activityGroupKey,
	activityGroupSummary,
	activityRowState,
	cursorFilter,
	groupActivity,
	mergeFirstPage,
	paginate
} from './activity';

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

describe('groupActivity', () => {
	// A lap in a stint: session s, driver d, track t, car c (all default to the same stint).
	const stint = (lapId: number, { s = 'S1' as string | null, d = 'D1', t = 1, c = 1 } = {}) => ({
		lapId,
		sessionId: s,
		driverId: d,
		trackId: t,
		carId: c
	});
	const ids = (groups: { laps: { lapId: number }[] }[]) =>
		groups.map((g) => g.laps.map((l) => l.lapId));

	it('laps of one session, track and car form one group, newest first', () => {
		expect(ids(groupActivity([stint(3), stint(2), stint(1)]))).toEqual([[3, 2, 1]]);
	});

	it('a different track, car, driver or session starts another group', () => {
		const groups = groupActivity([
			stint(5),
			stint(4, { t: 2 }),
			stint(3, { c: 2 }),
			stint(2, { d: 'D2' }),
			stint(1, { s: 'S2' })
		]);
		expect(ids(groups)).toEqual([[5], [4], [3], [2], [1]]);
	});

	it('two rigs at once: interleaved laps still group by stint, placed at the newest lap', () => {
		const groups = groupActivity([
			stint(6, { s: 'A' }),
			stint(5, { s: 'B' }),
			stint(4, { s: 'A' }),
			stint(3, { s: 'B' }),
			stint(2, { s: 'A' })
		]);
		expect(ids(groups)).toEqual([
			[6, 4, 2],
			[5, 3]
		]);
	});

	it('laps without a session are never grouped', () => {
		expect(ids(groupActivity([stint(2, { s: null }), stint(1, { s: null })]))).toEqual([[2], [1]]);
		expect(activityGroupKey(stint(7, { s: null }))).toBe('lap:7');
	});

	it('a group across a page boundary grows when the next page is appended', () => {
		const page1 = [stint(4), stint(3, { s: 'X' })];
		const page2 = [stint(2), stint(1)];
		const before = groupActivity(page1);
		const after = groupActivity([...page1, ...page2]);
		expect(ids(after)).toEqual([[4, 2, 1], [3]]);
		// Same key before and after, so the item on screen stays the same item.
		expect(after[0].key).toBe(before[0].key);
	});
});

describe('activityGroupSummary', () => {
	const timed = (laptime: number, isTrackRecord = false, isPersonalBest = false) => ({
		laptime,
		isTrackRecord,
		isPersonalBest
	});

	it('the fastest lap is the best; a plain stint is an upload', () => {
		const laps = [timed(91000), timed(89500), timed(90200)];
		expect(activityGroupSummary(laps)).toEqual({ best: laps[1], kind: 'upload' });
	});

	it('a record anywhere wins over a personal best', () => {
		const laps = [timed(90000, false, true), timed(89000, true, true)];
		expect(activityGroupSummary(laps).kind).toBe('record');
		expect(activityGroupSummary([timed(90000), timed(89900, false, true)]).kind).toBe(
			'personalBest'
		);
	});
});
