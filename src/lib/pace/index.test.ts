import { describe, expect, it } from 'vitest';
import {
	bestsFor,
	bestsKey,
	classifyLap,
	classifyPace,
	hasPaceBadge,
	type LoungeBests
} from './index';
import { PACE_BAND } from '$lib/config/lounge';

// Record 90.000, session best 100.000 (green up to 101.000 with a 1% band).
const bests: LoungeBests = {
	trackId: 3,
	categoryId: 1,
	record: { lap: 90_000, s1: 30_000, s2: 31_000, s3: 29_000 },
	session: { lap: 100_000, s1: 33_000, s2: 34_000, s3: 33_000 }
};

describe('classifyPace: the ladder', () => {
	it('is record below the app-wide best', () => {
		expect(classifyPace(89_000, bests, 'lap')).toBe('record');
	});
	it('is sessionBest between the record and the session best', () => {
		expect(classifyPace(95_000, bests, 'lap')).toBe('sessionBest');
	});
	it('is onPace within the band', () => {
		expect(classifyPace(100_500, bests, 'lap')).toBe('onPace');
	});
	it('is offPace past the band', () => {
		expect(classifyPace(102_000, bests, 'lap')).toBe('offPace');
	});
	it('uses the bests of the kind asked for', () => {
		expect(classifyPace(30_000, bests, 's1')).toBe('record');
		expect(classifyPace(30_000, bests, 's2')).toBe('record');
		expect(classifyPace(30_000, bests, 's3')).toBe('sessionBest');
		expect(classifyPace(34_200, bests, 's2')).toBe('onPace');
		expect(classifyPace(34_400, bests, 's2')).toBe('offPace');
	});
});

describe('classifyPace: ties and the band edge', () => {
	it('a tie with the record is record', () => {
		expect(classifyPace(90_000, bests, 'lap')).toBe('record');
	});
	it('a tie with the session best is sessionBest', () => {
		expect(classifyPace(100_000, bests, 'lap')).toBe('sessionBest');
	});
	it('exactly on the band edge is onPace', () => {
		expect(classifyPace(101_000, bests, 'lap')).toBe('onPace');
	});
	it('one ms past the band edge is offPace', () => {
		expect(classifyPace(101_001, bests, 'lap')).toBe('offPace');
	});
	it('the edge holds for awkward floats', () => {
		const odd: LoungeBests = {
			...bests,
			record: { ...bests.record, lap: 81_500 },
			session: { ...bests.session, lap: 82_100 }
		};
		// 82100 × 1.01 = 82921
		expect(classifyPace(82_921, odd, 'lap')).toBe('onPace');
		expect(classifyPace(82_922, odd, 'lap')).toBe('offPace');
	});
	it('takes a custom band', () => {
		expect(classifyPace(101_500, bests, 'lap', 0.02)).toBe('onPace');
		expect(classifyPace(100_500, bests, 'lap', 0)).toBe('offPace');
	});
	it('defaults to PACE_BAND', () => {
		expect(PACE_BAND).toBe(0.01);
	});
});

describe('classifyPace: nulls and missing rungs', () => {
	it('a null or undefined time is neutral', () => {
		expect(classifyPace(null, bests, 'lap')).toBe('neutral');
		expect(classifyPace(undefined, bests, 's1')).toBe('neutral');
	});
	it('no bests (unmapped) is neutral', () => {
		expect(classifyPace(80_000, null, 'lap')).toBe('neutral');
		expect(classifyPace(80_000, undefined, 'lap')).toBe('neutral');
	});
	it('without a session best: record when it beats the record, otherwise neutral', () => {
		const noSession: LoungeBests = {
			...bests,
			session: { lap: null, s1: null, s2: null, s3: null }
		};
		expect(classifyPace(89_000, noSession, 'lap')).toBe('record');
		expect(classifyPace(150_000, noSession, 'lap')).toBe('neutral');
	});
	it('without a record: the session rungs still apply', () => {
		const noRecord: LoungeBests = {
			...bests,
			record: { lap: null, s1: null, s2: null, s3: null }
		};
		expect(classifyPace(80_000, noRecord, 'lap')).toBe('sessionBest');
		expect(classifyPace(100_800, noRecord, 'lap')).toBe('onPace');
		expect(classifyPace(120_000, noRecord, 'lap')).toBe('offPace');
	});
	it('with no bests at all for a kind (no laps with sectors) is neutral', () => {
		const noSectors: LoungeBests = {
			...bests,
			record: { ...bests.record, s1: null },
			session: { ...bests.session, s1: null }
		};
		expect(classifyPace(30_000, noSectors, 's1')).toBe('neutral');
	});
});

describe('bests lookup', () => {
	const map = { [bestsKey(3, 1)]: bests };
	it('keys are trackId:categoryId', () => {
		expect(bestsKey(3, 1)).toBe('3:1');
	});
	it('finds a lap’s bests by its track and category', () => {
		expect(bestsFor(map, { trackId: 3, categoryId: 1 })).toBe(bests);
	});
	it('is null for unknown or missing ids', () => {
		expect(bestsFor(map, { trackId: 9, categoryId: 1 })).toBeNull();
		expect(bestsFor(map, { trackId: null, categoryId: 1 })).toBeNull();
		expect(bestsFor(map, null)).toBeNull();
	});
});

describe('hasPaceBadge', () => {
	it('only record, sessionBest and onPace carry a badge', () => {
		expect(
			['record', 'sessionBest', 'onPace', 'offPace', 'neutral'].map((p) => hasPaceBadge(p as never))
		).toEqual([true, true, true, false, false]);
	});
});

describe('classifyLap', () => {
	const map = { [bestsKey(3, 1)]: bests };
	it('classifies the lap and each sector with the lap’s own bests', () => {
		expect(
			classifyLap(
				{ timeMs: 95_000, s1Ms: 29_000, s2Ms: 34_300, s3Ms: 40_000, trackId: 3, categoryId: 1 },
				map
			)
		).toEqual({ lap: 'sessionBest', s1: 'record', s2: 'onPace', s3: 'offPace' });
	});
	it('a lap without sectors has neutral sectors', () => {
		expect(
			classifyLap(
				{ timeMs: 100_000, s1Ms: null, s2Ms: null, s3Ms: null, trackId: 3, categoryId: 1 },
				map
			)
		).toEqual({ lap: 'sessionBest', s1: 'neutral', s2: 'neutral', s3: 'neutral' });
	});
	it('a lap with no bests row is neutral throughout', () => {
		expect(
			classifyLap({ timeMs: 1, s1Ms: 1, s2Ms: 1, s3Ms: 1, trackId: 9, categoryId: 1 }, map)
		).toEqual({ lap: 'neutral', s1: 'neutral', s2: 'neutral', s3: 'neutral' });
	});
});
