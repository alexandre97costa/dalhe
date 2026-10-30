import { describe, expect, it } from 'vitest';
import {
	SESSION_CARD_OPEN_KEY,
	assistLevel,
	readSessionCardOpen,
	staleMinutes,
	writeSessionCardOpen
} from './session-card';

function memoryStorage(initial: Record<string, string> = {}) {
	const data = new Map(Object.entries(initial));
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => void data.set(key, value),
		data
	};
}

const throwing = {
	getItem: () => {
		throw new Error('SecurityError');
	},
	setItem: () => {
		throw new Error('QuotaExceededError');
	}
};

describe('readSessionCardOpen / writeSessionCardOpen', () => {
	it('defaults to collapsed', () => {
		expect(readSessionCardOpen(memoryStorage())).toBe(false);
		expect(readSessionCardOpen(null)).toBe(false);
		expect(readSessionCardOpen(undefined)).toBe(false);
	});

	it('round-trips the stored choice', () => {
		const storage = memoryStorage();
		writeSessionCardOpen(storage, true);
		expect(storage.data.get(SESSION_CARD_OPEN_KEY)).toBe('true');
		expect(readSessionCardOpen(storage)).toBe(true);
		writeSessionCardOpen(storage, false);
		expect(readSessionCardOpen(storage)).toBe(false);
	});

	it('ignores unreadable values', () => {
		expect(readSessionCardOpen(memoryStorage({ [SESSION_CARD_OPEN_KEY]: 'yes' }))).toBe(false);
	});

	it('falls back to the default when storage throws', () => {
		expect(readSessionCardOpen(throwing)).toBe(false);
		expect(() => writeSessionCardOpen(throwing, true)).not.toThrow();
	});
});

describe('staleMinutes', () => {
	it('is null without an age or while fresh', () => {
		expect(staleMinutes(null)).toBeNull();
		expect(staleMinutes(undefined)).toBeNull();
		expect(staleMinutes(Number.NaN)).toBeNull();
		expect(staleMinutes(0, 120)).toBeNull();
		expect(staleMinutes(120_000, 120)).toBeNull();
	});

	it('counts whole minutes once stale', () => {
		expect(staleMinutes(120_001, 120)).toBe(2);
		expect(staleMinutes(12 * 60_000 + 59_000, 120)).toBe(12);
	});
});

describe('assistLevel', () => {
	it('maps 0 to off and keeps other levels', () => {
		expect(assistLevel(0)).toBe('off');
		expect(assistLevel(6)).toBe(6);
	});

	it('is null when missing', () => {
		expect(assistLevel(null)).toBeNull();
		expect(assistLevel(undefined)).toBeNull();
	});
});
