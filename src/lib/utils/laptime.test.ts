import { describe, expect, it } from 'vitest';
import { convertTimeStringToMilliseconds } from './laptime';

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
