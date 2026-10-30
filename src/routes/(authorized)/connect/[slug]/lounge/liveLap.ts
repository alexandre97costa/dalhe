// Pure logic for the live lap card (Sprint 1.5, stream L): the sector tiles of the live lap
// and of the frozen lap, and the freeze decision (Decision 5). No Svelte, no Paraglide.
// Pace always comes from $lib/pace: times are never compared here.

import { FREEZE_WINDOW_S } from '$lib/config/lounge';
import { classifyLap, classifyPace, type BestsByKey, type LoungeBests, type Pace } from '$lib/pace';
import type { LapStats } from '$lib/types/rig';
import type { LatestLap } from '$lib/types/lounge';

export type SectorKind = 's1' | 's2' | 's3';
const KINDS: SectorKind[] = ['s1', 's2', 's3'];

export type SectorTile = {
	kind: SectorKind;
	// done: a completed sector; current: the sector being driven; future: not reached yet.
	state: 'done' | 'current' | 'future';
	// ms; null shows "–" (future sector, or a completed one the stats or the lap lack).
	time: number | null;
	// Neutral for the sector in progress, future sectors and missing times.
	pace: Pace;
};

// L1 + L2: completed sectors show s1_ms / s2_ms coloured against the live bests, the current
// sector shows currentSplit (neutral), later sectors "–".
export function liveSectorTiles(live: LapStats, liveBests: LoungeBests | null): SectorTile[] {
	const completed = [live.s1_ms, live.s2_ms];
	return KINDS.map((kind, index) => {
		const sector = index + 1;
		if (sector < live.currentSector) {
			const time = completed[index] ?? null;
			return { kind, state: 'done', time, pace: classifyPace(time, liveBests, kind) };
		}
		if (sector === live.currentSector) {
			return { kind, state: 'current', time: live.currentSplit, pace: 'neutral' };
		}
		return { kind, state: 'future', time: null, pace: 'neutral' };
	});
}

// L4: the frozen lap's three sectors, coloured against the bests of its own track + category.
// Also returns the lap's own pace (for its badge).
export function frozenLap(
	lap: LatestLap,
	bests: BestsByKey
): { pace: Pace; sectors: SectorTile[] } {
	const paces = classifyLap(lap, bests);
	const times = { s1: lap.s1Ms, s2: lap.s2Ms, s3: lap.s3Ms };
	return {
		pace: paces.lap,
		sectors: KINDS.map((kind) => ({ kind, state: 'done', time: times[kind], pace: paces[kind] }))
	};
}

// Decision 5: freeze on the latest lap of the session when it was at most FREEZE_WINDOW_S old
// at load time, unless this page view already froze on it (dismissed or expired).
export function shouldFreeze(
	lap: Pick<LatestLap, 'id' | 'ageMs'> | null | undefined,
	seen: ReadonlySet<number>
): boolean {
	if (!lap) return false;
	return lap.ageMs <= FREEZE_WINDOW_S * 1000 && !seen.has(lap.id);
}
