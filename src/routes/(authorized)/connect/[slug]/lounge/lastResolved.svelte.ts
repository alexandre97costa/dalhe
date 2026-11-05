// Keeps the last value of a streamed load promise, instead of a bare {#await} around the cards.
// A Refresh brings a new promise; the old value stays on screen until the new one resolves, so
// the cards stay mounted and keep their state (LiveLapCard's seen laps, Decision 5).
// Call during component init: it uses effects.
export function lastResolved<T>({
	promise,
	scope,
	onRefreshError
}: {
	promise: () => Promise<T>;
	// When this changes, the value is someone else's (another rig): forget it.
	scope: () => unknown;
	// The new promise rejected while the old value is on screen; the old value stays.
	onRefreshError: () => void;
}) {
	// Raw like `data`: plain server data, replaced whole, never mutated.
	let value = $state.raw<T | null>(null);
	let failed = $state(false);

	// Derived, so the reset below fires only when the scope's value changes: a Refresh replaces
	// the whole `data` object, but the rig id stays equal.
	const currentScope = $derived(scope());

	// .pre: before the DOM updates, so the other rig's data never renders under the new header.
	$effect.pre(() => {
		void currentScope;
		value = null;
	});

	$effect(() => {
		const current = promise();
		let stale = false;
		failed = false;
		current.then(
			(resolved) => {
				if (!stale) value = resolved;
			},
			() => {
				if (stale) return;
				if (value === null) failed = true;
				else onRefreshError();
			}
		);
		return () => {
			stale = true;
		};
	});

	return {
		// Null until the first promise resolves (and again after a scope change).
		get value() {
			return value;
		},
		// The promise rejected with no value to fall back on.
		get failed() {
			return failed;
		}
	};
}
