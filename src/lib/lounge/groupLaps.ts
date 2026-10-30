// Track/car groups for the lounge's session laps (Sprint 1.5, S3). Pure: no Svelte, no Paraglide.
// The list renders a separator ("Track · Car") before each group, in both views.

export type LapSort = 'recent' | 'fastest';

// The fields grouping needs (SessionLap has them all). timeMs may be null: those laps sort last.
export type GroupableLap = {
	id: number;
	lapNumber: number;
	timeMs: number | null;
	trackId: number;
	trackName: string;
	carId: number;
	carMake: string;
	carModel: string;
};

export type LapGroup<T extends GroupableLap> = {
	// Unique within one result: use it as the {#each} key.
	key: string;
	// Separator label parts: "Brands Hatch", "McLaren 720S Evo".
	label: { track: string; car: string };
	laps: T[];
};

// Recent first: newest lap first (by lapNumber); a new group wherever the track or the car differs
// from the previous lap, so Brands → Spa → Brands shows Brands twice.
// Fastest first: tracks ordered by their most recent lap; inside each track, laps by time (null
// times last, ties by lapNumber); a new group wherever the car changes. Two cars with interleaved
// times at one track therefore produce several groups for the same car.
// The empty list gives no groups; any other list gives at least one.
export function groupLaps<T extends GroupableLap>(
	laps: readonly T[],
	sort: LapSort
): LapGroup<T>[] {
	const recent = [...laps].sort((a, b) => b.lapNumber - a.lapNumber);
	if (sort === 'recent') return split(recent);

	// Tracks in order of their most recent lap (the first time each appears in `recent`).
	const byTrack = new Map<number, T[]>();
	for (const lap of recent) {
		const track = byTrack.get(lap.trackId);
		if (track) track.push(lap);
		else byTrack.set(lap.trackId, [lap]);
	}
	const sorted = [...byTrack.values()].flatMap((track) => track.sort(byTime));
	return split(sorted);
}

function byTime(a: GroupableLap, b: GroupableLap): number {
	if (a.timeMs === null || b.timeMs === null) {
		if (a.timeMs !== b.timeMs) return a.timeMs === null ? 1 : -1;
	} else if (a.timeMs !== b.timeMs) {
		return a.timeMs - b.timeMs;
	}
	return a.lapNumber - b.lapNumber;
}

// Splits an ordered list wherever the track or the car differs from the previous lap. In fastest
// first the tracks are already contiguous, so only car changes split inside a track.
function split<T extends GroupableLap>(laps: T[]): LapGroup<T>[] {
	const groups: LapGroup<T>[] = [];
	let prev: T | undefined;
	for (const lap of laps) {
		if (!prev || prev.trackId !== lap.trackId || prev.carId !== lap.carId) {
			groups.push({
				key: `${groups.length}:${lap.id}`,
				label: { track: lap.trackName, car: `${lap.carMake} ${lap.carModel}` },
				laps: []
			});
		}
		groups[groups.length - 1].laps.push(lap);
		prev = lap;
	}
	return groups;
}
