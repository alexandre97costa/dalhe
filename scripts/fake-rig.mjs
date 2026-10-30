// Fake rig: calls the rig endpoints the way the SimHub overlay does, against the local stack only.
// Run with `pnpm rig <scenario...>` (`pnpm rig` lists them, `pnpm rig all` runs every one).
// Needs `supabase start` and `pnpm dev`. `--rig sala` targets Sala instead of Garagem.
// Some scenarios write laps and sessions to the local database; `pnpm db:reset` cleans up.
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.FAKE_RIG_URL ?? 'http://localhost:5173';
const TIMEOUT_MINS = parseInt(process.env.SESSION_TIMEOUT_MINS ?? '120');
// Mirrors src/lib/config/lounge.ts (this script can't import TypeScript)
const FREEZE_WINDOW_S = 20;
const STATS_STALE_AFTER_S = 120;

// Seed rigs and their local keys (supabase/seed.sql)
const RIGS = {
	garagem: { id: 'b0000000-0000-4000-8000-000000000002', key: 'local-garagem-key' },
	sala: { id: 'b0000000-0000-4000-8000-000000000001', key: 'local-sala-key' }
};
const UNKNOWN_RIG_ID = 'b0000000-0000-4000-8000-0000000000ee';
const NOT_FOUND = JSON.stringify({ error: 'not_found' });

// The endpoints create sessions and laps even on GET: never point this at anything but the local stack.
function assertLocal(url, what) {
	const host = new URL(url).hostname;
	if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) {
		console.error(`Refusing to run: ${what} is ${host}, not the local stack.`);
		process.exit(2);
	}
}
assertLocal(BASE_URL, 'the app URL');
assertLocal(process.env.PUBLIC_SUPABASE_URL ?? 'http://missing', 'PUBLIC_SUPABASE_URL in .env');

function admin() {
	return createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false }
	});
}

async function call(rig, path = '', params = {}, { rigId = rig.id, key = rig.key } = {}) {
	const query = new URLSearchParams(params);
	if (key !== null) query.set('k', key);
	const res = await fetch(`${BASE_URL}/rig/${rigId}${path}?${query}`);
	const text = await res.text();
	// Print the call without the key
	const shown = new URLSearchParams(params).toString();
	const keyShown = key === null ? '' : shown ? '&k=…' : 'k=…';
	console.log(`  GET /rig/${rigId}${path}?${decodeURIComponent(shown)}${keyShown}`);
	console.log(`  → ${res.status} ${text}`);
	return { status: res.status, text, body: safeJson(text) };
}

function safeJson(text) {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

// A lap as the overlay sends it: SimHub car/track ids and sector times as HH:MM:SS.fffffff.
// Random by default, so each run creates a new lap instead of hitting a duplicate.
const SEED_CAR = 'porsche_991ii_gt3_r';
const SEED_TRACK = 'brands_hatch';

function simhubTime(ms) {
	const s = (ms / 1000).toFixed(7).padStart(10, '0');
	return `00:00:${s}`;
}

function lapParams({
	s1,
	s2,
	s3,
	laptime = s1 + s2 + s3,
	carId = SEED_CAR,
	trackId = SEED_TRACK
} = {}) {
	return {
		laptime_ms: String(laptime),
		s1_time: simhubTime(s1),
		s2_time: simhubTime(s2),
		s3_time: simhubTime(s3),
		carId,
		trackId
	};
}

function randomLap(overrides = {}) {
	const jitter = () => Math.floor(Math.random() * 2000);
	return lapParams({
		s1: 29000 + jitter(),
		s2: 31000 + jitter(),
		s3: 26000 + jitter(),
		...overrides
	});
}

// Stats as the overlay sends them (src/lib/types/rig.ts: zLapStats, zSessionStats)
const LAP_STATS = {
	lapNumber: '6',
	lapTotalCount: '20',
	laptime_ms: '41230',
	deltaBest: '-0.21',
	progress: '0.48',
	valid: 'true',
	currentSector: '2',
	currentSplit: '29012',
	s1_ms: '29012',
	bestS1_ms: '28599',
	bestS2_ms: '30120',
	bestS3_ms: '25590'
};
const SESSION_STATS = {
	CurrentGame: 'AssettoCorsaCompetizione',
	TrackId: SEED_TRACK,
	SessionTypeName: 'PRACTICE',
	CarId: SEED_CAR,
	CarClass: 'GT3',
	TCLevel: '3',
	ABSLevel: '2',
	BrakeBias: '-15',
	AirTemperature: '21',
	TrackTemperature: '27',
	rainIntensity: 'ACC_NO_RAIN',
	rainIntensityIn10min: 'ACC_DRIZZLE',
	rainIntensityIn30min: 'ACC_LIGHT_RAIN'
};

// Live stats in each sector of a lap (Sprint 1.5, F8). currentSplit: time so far in the
// sector being driven; s1_ms / s2_ms: the sectors already completed in this lap.
const LIVE_IN_SECTOR = {
	1: {
		...LAP_STATS,
		laptime_ms: '12040',
		progress: '0.15',
		currentSector: '1',
		currentSplit: '12040',
		s1_ms: undefined
	},
	2: {
		...LAP_STATS,
		laptime_ms: '41230',
		progress: '0.48',
		currentSector: '2',
		currentSplit: '15780',
		s1_ms: '25450'
	},
	3: {
		...LAP_STATS,
		laptime_ms: '70100',
		progress: '0.82',
		currentSector: '3',
		currentSplit: '14850',
		s1_ms: '25450',
		s2_ms: '29800'
	}
};
// A SimHub car id that isn't in the catalog: stats are stored, the lounge falls back to labels.
const UNMAPPED_CAR = 'fake_unmapped_gt3';

function withoutUndefined(params) {
	return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
}

function liveSectorScenario(sector) {
	return {
		about: `live lap stats in sector ${sector}: ok, stored with currentSector ${sector}`,
		async run(rig) {
			return withActiveSession(rig, async () => {
				const r = await call(rig, '/send/live', withoutUndefined(LIVE_IN_SECTOR[sector]));
				const stored = await storedStats(rig, 'lap_stats');
				const expected = LIVE_IN_SECTOR[sector];
				return (
					r.status === 200 &&
					r.body?.status === 'ok' &&
					stored?.currentSector === sector &&
					stored?.currentSplit === Number(expected.currentSplit) &&
					(stored?.s1_ms ?? null) === (expected.s1_ms ? Number(expected.s1_ms) : null) &&
					(stored?.s2_ms ?? null) === (expected.s2_ms ? Number(expected.s2_ms) : null)
				);
			});
		}
	};
}

async function openSession(rig) {
	const { data, error } = await admin()
		.from('rig_session')
		.select('id, last_activity_at')
		.eq('rig_id', rig.id)
		.is('ended_at', null)
		.maybeSingle();
	if (error) throw error;
	return data;
}

async function lastActivity(sessionId) {
	const { data } = await admin()
		.from('rig_session')
		.select('last_activity_at')
		.eq('id', sessionId)
		.single();
	return data?.last_activity_at;
}

async function storedStats(rig, column) {
	const { data } = await admin().from('rig_stats').select(column).eq('id', rig.id).maybeSingle();
	return data?.[column] ?? null;
}

// Runs fn with the rig's session past the timeout (an anonymous one if there is none),
// then puts the rig back the way it was.
async function withStaleSession(rig, fn) {
	const db = admin();
	const open = await openSession(rig);
	const stale = new Date(Date.now() - (TIMEOUT_MINS + 1) * 60_000).toISOString();
	let sessionId = open?.id;
	if (open) {
		await db.from('rig_session').update({ last_activity_at: stale }).eq('id', open.id);
	} else {
		const { data, error } = await db
			.from('rig_session')
			.insert({ rig_id: rig.id, last_activity_at: stale })
			.select('id')
			.single();
		if (error) throw error;
		sessionId = data.id;
	}
	try {
		return await fn(sessionId);
	} finally {
		if (open) {
			await db
				.from('rig_session')
				.update({ last_activity_at: open.last_activity_at })
				.eq('id', open.id);
		} else {
			await db.from('rig_session').delete().eq('id', sessionId);
		}
	}
}

// Runs fn with an active session on the rig: the current one if it is recent,
// otherwise a fresh anonymous one that is removed afterwards.
async function withActiveSession(rig, fn) {
	const open = await openSession(rig);
	const recent =
		open && new Date(open.last_activity_at) > new Date(Date.now() - TIMEOUT_MINS * 60_000);
	if (recent) return fn(open.id);
	if (open) throw new Error('the rig has a stale open session; send a lap or connect first');

	const db = admin();
	const { data, error } = await db
		.from('rig_session')
		.insert({ rig_id: rig.id })
		.select('id')
		.single();
	if (error) throw error;
	try {
		return await fn(data.id);
	} finally {
		await db.from('rig_session').delete().eq('id', data.id);
	}
}

function sameKeys(body, keys) {
	return body !== null && Object.keys(body).sort().join() === [...keys].sort().join();
}

// Each scenario returns true when the response is what the contract says (docs/rig-endpoints.md).
const scenarios = {
	poll: {
		about: 'poll: rig name, whether a session is active, driver name, no ids',
		async run(rig) {
			const r = await call(rig);
			return r.status === 200 && sameKeys(r.body, ['rigName', 'sessionActive', 'driverName']);
		}
	},
	'no-key': {
		about: 'poll without a key: 404',
		async run(rig) {
			const r = await call(rig, '', {}, { key: null });
			return r.status === 404 && r.text === NOT_FOUND;
		}
	},
	'wrong-key': {
		about: 'poll with a wrong key: 404, same body as an unknown rig',
		async run(rig) {
			const r = await call(rig, '', {}, { key: 'wrong-key' });
			return r.status === 404 && r.text === NOT_FOUND;
		}
	},
	'unknown-rig': {
		about: 'poll an unknown rig with a valid key: 404',
		async run(rig) {
			const r = await call(rig, '', {}, { rigId: UNKNOWN_RIG_ID });
			return r.status === 404 && r.text === NOT_FOUND;
		}
	},
	'lap-created': {
		about: 'a new lap: 200 created, with its id',
		async run(rig) {
			const r = await call(rig, '/send/new', randomLap());
			return r.status === 200 && r.body?.status === 'created' && Number.isInteger(r.body?.lapId);
		}
	},
	'lap-duplicate': {
		about: 'the same lap twice: created, then duplicate without touching the session',
		async run(rig) {
			const lap = randomLap();
			const first = await call(rig, '/send/new', lap);
			const activity = async () =>
				(
					await admin()
						.from('rig_session')
						.select('last_activity_at')
						.eq('rig_id', rig.id)
						.is('ended_at', null)
						.maybeSingle()
				).data?.last_activity_at;
			const before = await activity();
			const again = await call(rig, '/send/new', lap);
			const after = await activity();
			return (
				first.body?.status === 'created' &&
				again.status === 200 &&
				sameKeys(again.body, ['status']) &&
				again.body.status === 'duplicate' &&
				before === after
			);
		}
	},
	'lap-sectors': {
		about: "sectors that don't add up to the lap time: rejected",
		async run(rig) {
			const lap = randomLap();
			const r = await call(rig, '/send/new', {
				...lap,
				laptime_ms: String(Number(lap.laptime_ms) + 1)
			});
			return (
				r.status === 200 && r.body?.status === 'rejected' && r.body?.reason === 'sectors_mismatch'
			);
		}
	},
	'lap-unknown-car': {
		about: 'a car missing from the catalog: rejected',
		async run(rig) {
			const r = await call(rig, '/send/new', randomLap({ carId: 'not_a_real_car' }));
			return r.status === 200 && r.body?.status === 'rejected' && r.body?.reason === 'unknown_car';
		}
	},
	'lap-unknown-track': {
		about: 'a track missing from the catalog: rejected',
		async run(rig) {
			const r = await call(rig, '/send/new', randomLap({ trackId: 'not_a_real_track' }));
			return (
				r.status === 200 && r.body?.status === 'rejected' && r.body?.reason === 'unknown_track'
			);
		}
	},
	'lap-invalid': {
		about: 'a lap with a missing sector: rejected',
		async run(rig) {
			const { s3_time, ...lap } = randomLap();
			const r = await call(rig, '/send/new', lap);
			return (
				r.status === 200 && r.body?.status === 'rejected' && r.body?.reason === 'invalid_params'
			);
		}
	},
	'lap-wrong-key': {
		about: 'a lap with a wrong key: 404, nothing written',
		async run(rig) {
			const r = await call(rig, '/send/new', randomLap(), { key: 'wrong-key' });
			return r.status === 404 && r.text === NOT_FOUND;
		}
	},
	'stats-live': {
		about: 'live lap stats with an active session: ok, stored, activity untouched',
		async run(rig) {
			return withActiveSession(rig, async (sessionId) => {
				const before = await lastActivity(sessionId);
				const r = await call(rig, '/send/live', LAP_STATS);
				const stored = await storedStats(rig, 'lap_stats');
				return (
					r.status === 200 &&
					r.body?.status === 'ok' &&
					stored?.lapNumber === 6 &&
					stored?.valid === true &&
					!('k' in stored) &&
					(await lastActivity(sessionId)) === before
				);
			});
		}
	},
	'stats-session': {
		about: 'sim session stats with an active session: ok, stored',
		async run(rig) {
			return withActiveSession(rig, async () => {
				const r = await call(rig, '/send/session', SESSION_STATS);
				const stored = await storedStats(rig, 'session_stats');
				return (
					r.status === 200 && r.body?.status === 'ok' && stored?.TCLevel === 3 && !('k' in stored)
				);
			});
		}
	},
	'stats-ignored': {
		about: 'stats while the session is past the timeout: ignored, nothing written',
		async run(rig) {
			return withStaleSession(rig, async () => {
				const before = JSON.stringify(await storedStats(rig, 'lap_stats'));
				const r = await call(rig, '/send/live', { ...LAP_STATS, lapNumber: '99' });
				const after = JSON.stringify(await storedStats(rig, 'lap_stats'));
				return r.status === 200 && r.body?.status === 'ignored' && before === after;
			});
		}
	},
	'stats-rejected': {
		about: 'live lap stats with an invalid param: rejected',
		async run(rig) {
			const r = await call(rig, '/send/live', { ...LAP_STATS, progress: '2' });
			return (
				r.status === 200 && r.body?.status === 'rejected' && r.body?.reason === 'invalid_params'
			);
		}
	},
	'stats-old-rain-name': {
		about: 'sim session stats with the old rainIntesity spelling: rejected (Sprint 1.5 rename)',
		async run(rig) {
			const { rainIntensity, ...rest } = SESSION_STATS;
			const r = await call(rig, '/send/session', { ...rest, rainIntesity: rainIntensity });
			return (
				r.status === 200 && r.body?.status === 'rejected' && r.body?.reason === 'invalid_params'
			);
		}
	},
	'live-sector-1': liveSectorScenario(1),
	'live-sector-2': liveSectorScenario(2),
	'live-sector-3': liveSectorScenario(3),
	freeze: {
		about: `a new lap: the newest of the active session, under ${FREEZE_WINDOW_S}s old (load the lounge now to see the freeze)`,
		async run(rig) {
			const r = await call(rig, '/send/new', randomLap());
			if (r.body?.status !== 'created') return false;
			const open = await openSession(rig);
			const { data: newest, error } = await admin()
				.from('lap_time')
				.select('id, created_at')
				.eq('session_id', open?.id)
				.order('created_at', { ascending: false })
				.limit(1)
				.single();
			if (error) throw error;
			const ageS = (Date.now() - new Date(newest.created_at).getTime()) / 1000;
			console.log(`  newest lap ${newest.id}, ${ageS.toFixed(1)}s old`);
			return newest.id === r.body.lapId && ageS <= FREEZE_WINDOW_S;
		}
	},
	'stats-stale': {
		about: `session and live stats older than ${STATS_STALE_AFTER_S}s (stale; load the lounge to see "Updated n min ago")`,
		async run(rig) {
			return withActiveSession(rig, async () => {
				const session = await call(rig, '/send/session', SESSION_STATS);
				const live = await call(rig, '/send/live', LAP_STATS);
				// Backdate both timestamps directly: the endpoints always store now()
				const old = new Date(Date.now() - (STATS_STALE_AFTER_S + 300) * 1000).toISOString();
				const { error } = await admin()
					.from('rig_stats')
					.update({ session_updated_at: old, lap_updated_at: old })
					.eq('id', rig.id);
				if (error) throw error;
				const { data } = await admin()
					.from('rig_stats')
					.select('session_updated_at, lap_updated_at')
					.eq('id', rig.id)
					.single();
				const age = (t) => (Date.now() - new Date(t).getTime()) / 1000;
				return (
					session.body?.status === 'ok' &&
					live.body?.status === 'ok' &&
					age(data.session_updated_at) > STATS_STALE_AFTER_S &&
					age(data.lap_updated_at) > STATS_STALE_AFTER_S
				);
			});
		}
	},
	'unmapped-car': {
		about: `live and session stats for a car missing from the catalog (${UNMAPPED_CAR}): ok, stored`,
		async run(rig) {
			return withActiveSession(rig, async () => {
				const { data: car } = await admin()
					.from('car')
					.select('id')
					.eq('simhub_carid', UNMAPPED_CAR)
					.maybeSingle();
				const session = await call(rig, '/send/session', { ...SESSION_STATS, CarId: UNMAPPED_CAR });
				const live = await call(rig, '/send/live', withoutUndefined(LIVE_IN_SECTOR[2]));
				const stored = await storedStats(rig, 'session_stats');
				return (
					car === null &&
					session.body?.status === 'ok' &&
					live.body?.status === 'ok' &&
					stored?.CarId === UNMAPPED_CAR
				);
			});
		}
	},
	'stale-session': {
		about: 'poll while the session is past the timeout: inactive, nothing written',
		async run(rig) {
			return withStaleSession(rig, async (sessionId) => {
				const r = await call(rig);
				const { data: after } = await admin()
					.from('rig_session')
					.select('ended_at')
					.eq('id', sessionId)
					.single();
				return r.status === 200 && r.body?.sessionActive === false && after?.ended_at === null;
			});
		}
	}
};

const args = process.argv.slice(2);
const rigFlag = args.indexOf('--rig');
const rigName = rigFlag >= 0 ? args.splice(rigFlag, 2)[1] : 'garagem';
const rig = RIGS[rigName];
const names = args.includes('all') ? Object.keys(scenarios) : args;

if (!rig || names.length === 0 || names.some((n) => !scenarios[n])) {
	console.log('Usage: pnpm rig <scenario...|all> [--rig garagem|sala]\n');
	for (const [name, s] of Object.entries(scenarios)) console.log(`  ${name.padEnd(16)} ${s.about}`);
	process.exit(names.length === 0 ? 0 : 1);
}

let failed = 0;
for (const name of names) {
	console.log(`\n${name} (${rigName}): ${scenarios[name].about}`);
	const ok = await scenarios[name].run(rig).catch((e) => {
		console.log(`  error: ${e.message}`);
		return false;
	});
	if (!ok) failed++;
	console.log(ok ? '  PASS' : '  FAIL');
}
console.log(`\n${names.length - failed}/${names.length} scenarios passed`);
process.exit(failed ? 1 : 0);
