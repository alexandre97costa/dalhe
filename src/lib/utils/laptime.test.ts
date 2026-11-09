import { describe, expect, it } from 'vitest';
import {
	convertTimeStringToMilliseconds,
	digitsToMilliseconds,
	lastSectorMilliseconds
} from './laptime';

// SimHub sends sector times as HH:MM:SS.fffffff. Float seconds times 1000 can land just off an
// integer (8.001 * 1000 = 8000.999…), which used to fail the `.int()` check and reject the lap.
describe('convertTimeStringToMilliseconds', () => {
	it('converts normal sector times', () => {
		expect(convertTimeStringToMilliseconds('00:00:29.1650000')).toBe(29165);
		expect(convertTimeStringToMilliseconds('00:00:31.3180000')).toBe(31318);
		expect(convertTimeStringToMilliseconds('00:00:10.8620000')).toBe(10862);
	});

	it('rounds values whose float product is not an integer', () => {
		// Unrounded: 8000.999999999999, 32000.999999999996, 65525.99999999999
		for (const [time, ms] of [
			['00:00:08.0010000', 8001],
			['00:00:32.0010000', 32001],
			['00:01:05.5260000', 65526]
		] as const) {
			const result = convertTimeStringToMilliseconds(time);
			expect(result).toBe(ms);
			expect(Number.isInteger(result)).toBe(true);
		}
	});

	it('handles minutes, hours and zero', () => {
		expect(convertTimeStringToMilliseconds('00:01:27.8980000')).toBe(87898);
		expect(convertTimeStringToMilliseconds('01:00:00.0000000')).toBe(3_600_000);
		expect(convertTimeStringToMilliseconds('00:00:00.0000000')).toBe(0);
	});

	it('returns null for malformed input', () => {
		expect(convertTimeStringToMilliseconds('')).toBeNull();
		expect(convertTimeStringToMilliseconds('29.165')).toBeNull();
		expect(convertTimeStringToMilliseconds('not a time')).toBeNull();
	});
});

describe('digitsToMilliseconds', () => {
	it('reads MMSSmmm', () => {
		expect(digitsToMilliseconds('0127898')).toBe(87_898);
		expect(digitsToMilliseconds('0029165')).toBe(29_165);
		expect(digitsToMilliseconds('1000000')).toBe(600_000);
		expect(digitsToMilliseconds('0000000')).toBe(0);
	});

	it('refuses anything that is not 7 digits or has 60+ seconds', () => {
		expect(digitsToMilliseconds('')).toBeNull();
		expect(digitsToMilliseconds('012789')).toBeNull();
		expect(digitsToMilliseconds('01278980')).toBeNull();
		expect(digitsToMilliseconds('01:27.898')).toBeNull();
		expect(digitsToMilliseconds('0160000')).toBeNull();
	});
});

describe('lastSectorMilliseconds', () => {
	it('is the lap minus S1 and S2', () => {
		expect(lastSectorMilliseconds(87_898, 29_165, 31_318)).toBe(27_415);
	});

	it('is null until all three are known', () => {
		expect(lastSectorMilliseconds(null, 29_165, 31_318)).toBeNull();
		expect(lastSectorMilliseconds(87_898, null, 31_318)).toBeNull();
		expect(lastSectorMilliseconds(87_898, 29_165, null)).toBeNull();
	});

	it('can be zero or negative (the form refuses it)', () => {
		expect(lastSectorMilliseconds(60_000, 30_000, 30_000)).toBe(0);
		expect(lastSectorMilliseconds(60_000, 40_000, 30_000)).toBe(-10_000);
	});
});
