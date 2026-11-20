import { describe, expect, it } from 'vitest';
import { rainLabel, rainLevel } from './simhub';

describe('rainLevel', () => {
	it('takes the number the overlay sends (0 = no rain … 5 = thunderstorm)', () => {
		expect([0, 1, 2, 3, 4, 5].map((n) => rainLevel(n))).toEqual([0, 1, 2, 3, 4, 5]);
		expect(rainLevel('3')).toBe(3);
	});

	it('still reads the ACC names of older stored stats', () => {
		expect(rainLevel('ACC_NO_RAIN')).toBe(0);
		expect(rainLevel('ACC_THUNDERSTORM')).toBe(5);
	});

	it('null for missing or unknown values', () => {
		expect(rainLevel(null)).toBeNull();
		expect(rainLevel(undefined)).toBeNull();
		expect(rainLevel('')).toBeNull();
		expect(rainLevel(6)).toBeNull();
		expect(rainLevel(-1)).toBeNull();
		expect(rainLevel('ACC_SNOW')).toBeNull();
	});
});

describe('rainLabel', () => {
	it('labels numbers and names the same way', () => {
		expect(rainLabel(1)).toBe(rainLabel('ACC_DRIZZLE'));
		expect(rainLabel(5)).toBe(rainLabel('ACC_THUNDERSTORM'));
		expect(rainLabel(0)).not.toBeNull();
	});

	it('null when unknown', () => {
		expect(rainLabel(9)).toBeNull();
		expect(rainLabel(null)).toBeNull();
	});
});
