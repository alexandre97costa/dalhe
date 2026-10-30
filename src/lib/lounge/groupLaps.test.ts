import { describe, expect, it } from 'vitest';
import { groupLaps, type GroupableLap } from './groupLaps';

const BRANDS = { trackId: 1, trackName: 'Brands Hatch' };
const SPA = { trackId: 2, trackName: 'Spa' };
const MCLAREN = { carId: 10, carMake: 'McLaren', carModel: '720S Evo' };
const PORSCHE = { carId: 11, carMake: 'Porsche', carModel: '911 II' };

function lap(
	lapNumber: number,
	timeMs: number | null,
	track: typeof BRANDS,
	car: typeof MCLAREN
): GroupableLap {
	return { id: 100 + lapNumber, lapNumber, timeMs, ...track, ...car };
}

// Like the seeded Garagem session, newest first (as the load gives it):
// 1–2 Brands McLaren, 3–4 Spa McLaren, 5–8 Brands with the Porsche (5, 7) and McLaren (6, 8) interleaved.
const session = [
	lap(8, 84_500, BRANDS, MCLAREN),
	lap(7, 84_000, BRANDS, PORSCHE),
	lap(6, 85_000, BRANDS, MCLAREN),
	lap(5, 86_000, BRANDS, PORSCHE),
	lap(4, 139_000, SPA, MCLAREN),
	lap(3, 138_000, SPA, MCLAREN),
	lap(2, 83_000, BRANDS, MCLAREN),
	lap(1, 88_000, BRANDS, MCLAREN)
];

const shape = (groups: ReturnType<typeof groupLaps>) =>
	groups.map((g) => [`${g.label.track} · ${g.label.car}`, g.laps.map((l) => l.lapNumber)]);

describe('groupLaps: recent first', () => {
	it('splits wherever the track or the car changes, Brands twice', () => {
		expect(shape(groupLaps(session, 'recent'))).toEqual([
			['Brands Hatch · McLaren 720S Evo', [8]],
			['Brands Hatch · Porsche 911 II', [7]],
			['Brands Hatch · McLaren 720S Evo', [6]],
			['Brands Hatch · Porsche 911 II', [5]],
			['Spa · McLaren 720S Evo', [4, 3]],
			['Brands Hatch · McLaren 720S Evo', [2, 1]]
		]);
	});

	it('orders by lap number even if the input is not newest first', () => {
		const groups = groupLaps([...session].reverse(), 'recent');
		expect(groups.flatMap((g) => g.laps.map((l) => l.lapNumber))).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
	});

	it('splits on a track change with the same car (Brands → Spa → Brands)', () => {
		const laps = [lap(3, 1, BRANDS, MCLAREN), lap(2, 1, SPA, MCLAREN), lap(1, 1, BRANDS, MCLAREN)];
		expect(shape(groupLaps(laps, 'recent')).map(([label]) => label)).toEqual([
			'Brands Hatch · McLaren 720S Evo',
			'Spa · McLaren 720S Evo',
			'Brands Hatch · McLaren 720S Evo'
		]);
	});
});

describe('groupLaps: fastest first', () => {
	it('groups by track (most recent first), sorts by time, splits on car changes', () => {
		// Brands (latest lap 8) before Spa (latest lap 4). Brands by time: 2, 7, 8, 6, 5, 1.
		// The two cars interleave, so the same car appears in several groups (as the doc specifies).
		expect(shape(groupLaps(session, 'fastest'))).toEqual([
			['Brands Hatch · McLaren 720S Evo', [2]],
			['Brands Hatch · Porsche 911 II', [7]],
			['Brands Hatch · McLaren 720S Evo', [8, 6]],
			['Brands Hatch · Porsche 911 II', [5]],
			['Brands Hatch · McLaren 720S Evo', [1]],
			['Spa · McLaren 720S Evo', [3, 4]]
		]);
	});

	it('merges a track visited twice into one track block', () => {
		const laps = [
			lap(3, 90, BRANDS, MCLAREN),
			lap(2, 200, SPA, MCLAREN),
			lap(1, 80, BRANDS, MCLAREN)
		];
		expect(shape(groupLaps(laps, 'fastest'))).toEqual([
			['Brands Hatch · McLaren 720S Evo', [1, 3]],
			['Spa · McLaren 720S Evo', [2]]
		]);
	});

	it('shows one car change at one track as two groups', () => {
		const laps = [
			lap(4, 81, BRANDS, PORSCHE),
			lap(3, 80, BRANDS, PORSCHE),
			lap(2, 91, BRANDS, MCLAREN),
			lap(1, 90, BRANDS, MCLAREN)
		];
		expect(shape(groupLaps(laps, 'fastest'))).toEqual([
			['Brands Hatch · Porsche 911 II', [3, 4]],
			['Brands Hatch · McLaren 720S Evo', [1, 2]]
		]);
	});

	it('puts laps with a null time last, ties by lap number', () => {
		const laps = [
			lap(4, null, BRANDS, MCLAREN),
			lap(3, 90, BRANDS, MCLAREN),
			lap(2, 90, BRANDS, MCLAREN),
			lap(1, null, BRANDS, MCLAREN)
		];
		expect(shape(groupLaps(laps, 'fastest'))).toEqual([
			['Brands Hatch · McLaren 720S Evo', [2, 3, 1, 4]]
		]);
	});
});

describe('groupLaps: edges', () => {
	it('always gives one group for a single track and car', () => {
		const laps = [lap(2, 90, SPA, PORSCHE), lap(1, 91, SPA, PORSCHE)];
		for (const sort of ['recent', 'fastest'] as const) {
			const groups = groupLaps(laps, sort);
			expect(groups).toHaveLength(1);
			expect(groups[0].label).toEqual({ track: 'Spa', car: 'Porsche 911 II' });
		}
	});

	it('gives no groups for no laps', () => {
		expect(groupLaps([], 'recent')).toEqual([]);
		expect(groupLaps([], 'fastest')).toEqual([]);
	});

	it('gives unique keys and does not mutate the input', () => {
		const input = [...session];
		const groups = groupLaps(input, 'fastest');
		expect(new Set(groups.map((g) => g.key)).size).toBe(groups.length);
		expect(input).toEqual(session);
	});
});
