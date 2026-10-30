import { describe, expect, it } from 'vitest';
import { FREEZE_WINDOW_S } from '$lib/config/lounge';
import type { LoungeBests } from '$lib/pace';
import type { LapStats } from '$lib/types/rig';
import type { LatestLap } from '$lib/types/lounge';
import { frozenLap, liveSectorTiles, shouldFreeze } from './liveLap';

const bests: LoungeBests = {
	trackId: 3,
	categoryId: 1,
	record: { lap: 85000, s1: 28000, s2: 30000, s3: 25000 },
	session: { lap: 87000, s1: 29000, s2: 31000, s3: 26000 }
};

const live = (overrides: Partial<LapStats>): LapStats => ({
	lapNumber: 6,
	laptime_ms: 41230,
	deltaBest: -0.21,
	progress: 0.48,
	valid: true,
	currentSector: 2,
	currentSplit: 12218,
	s1_ms: 29012,
	...overrides
});

const lap = (overrides: Partial<LatestLap> = {}): LatestLap => ({
	id: 42,
	lapNumber: 8,
	timeMs: 86500,
	s1Ms: 27900,
	s2Ms: 31000,
	s3Ms: 27600,
	createdAt: '2026-10-30T12:00:00Z',
	driverName: 'carla',
	trackId: 3,
	trackName: 'Brands Hatch',
	carId: 7,
	carMake: 'McLaren',
	carModel: '720S Evo',
	categoryId: 1,
	categoryName: 'GT3',
	ageMs: 5000,
	...overrides
});

describe('liveSectorTiles', () => {
	it('sector 1: split in S1, S2 and S3 still to come', () => {
		const tiles = liveSectorTiles(
			live({ currentSector: 1, currentSplit: 12040, s1_ms: undefined }),
			bests
		);
		expect(tiles.map((t) => [t.state, t.time, t.pace])).toEqual([
			['current', 12040, 'neutral'],
			['future', null, 'neutral'],
			['future', null, 'neutral']
		]);
	});

	it('sector 2: S1 coloured, split in S2', () => {
		const tiles = liveSectorTiles(live({ currentSector: 2, s1_ms: 29012 }), bests);
		expect(tiles.map((t) => [t.state, t.time, t.pace])).toEqual([
			['done', 29012, 'onPace'],
			['current', 12218, 'neutral'],
			['future', null, 'neutral']
		]);
	});

	it('sector 3: S1 and S2 coloured, split in S3', () => {
		const tiles = liveSectorTiles(
			live({ currentSector: 3, currentSplit: 9000, s1_ms: 27900, s2_ms: 32000 }),
			bests
		);
		expect(tiles.map((t) => [t.state, t.time, t.pace])).toEqual([
			['done', 27900, 'record'],
			['done', 32000, 'offPace'],
			['current', 9000, 'neutral']
		]);
	});

	it('no bests (unmapped): every sector neutral', () => {
		const tiles = liveSectorTiles(live({ currentSector: 3, s1_ms: 27900, s2_ms: 30000 }), null);
		expect(tiles.map((t) => t.pace)).toEqual(['neutral', 'neutral', 'neutral']);
	});

	it('a completed sector missing from the stats shows no time, neutral', () => {
		const tiles = liveSectorTiles(live({ currentSector: 2, s1_ms: undefined }), bests);
		expect(tiles[0]).toEqual({ kind: 's1', state: 'done', time: null, pace: 'neutral' });
	});

	it('ignores the SimHub bestSx_ms', () => {
		const tiles = liveSectorTiles(live({ currentSector: 2, s1_ms: 29012, bestS1_ms: 30000 }), null);
		expect(tiles[0].pace).toBe('neutral');
	});
});

describe('frozenLap', () => {
	it('colours all three sectors and the lap against its own bests', () => {
		const frozen = frozenLap(lap(), { '3:1': bests });
		expect(frozen.pace).toBe('sessionBest');
		expect(frozen.sectors.map((s) => [s.time, s.pace])).toEqual([
			[27900, 'record'],
			[31000, 'sessionBest'],
			[27600, 'offPace']
		]);
	});

	it('a lap without sectors or without bests stays neutral', () => {
		const frozen = frozenLap(lap({ s1Ms: null, s2Ms: null, s3Ms: null }), {});
		expect(frozen.pace).toBe('neutral');
		expect(frozen.sectors.map((s) => [s.time, s.pace])).toEqual([
			[null, 'neutral'],
			[null, 'neutral'],
			[null, 'neutral']
		]);
	});
});

describe('shouldFreeze', () => {
	const none = new Set<number>();

	it('no lap: no freeze', () => {
		expect(shouldFreeze(null, none)).toBe(false);
	});

	it('a fresh lap freezes, up to and including the window', () => {
		expect(shouldFreeze(lap({ ageMs: 0 }), none)).toBe(true);
		expect(shouldFreeze(lap({ ageMs: FREEZE_WINDOW_S * 1000 }), none)).toBe(true);
	});

	it('an older lap does not freeze', () => {
		expect(shouldFreeze(lap({ ageMs: FREEZE_WINDOW_S * 1000 + 1 }), none)).toBe(false);
	});

	it('a lap already seen (dismissed or expired) does not freeze again', () => {
		expect(shouldFreeze(lap({ id: 42, ageMs: 1000 }), new Set([42]))).toBe(false);
		expect(shouldFreeze(lap({ id: 43, ageMs: 1000 }), new Set([42]))).toBe(true);
	});
});
