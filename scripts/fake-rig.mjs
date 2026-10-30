// Fake rig: calls the rig endpoints the way the SimHub overlay does, against the local stack only.
// Run with `pnpm rig <scenario...>` (`pnpm rig` lists them, `pnpm rig all` runs every one).
// Needs `supabase start` and `pnpm dev`. `--rig sala` targets Sala instead of Garagem.
// Some scenarios write laps and sessions to the local database; `pnpm db:reset` cleans up.
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.FAKE_RIG_URL ?? 'http://localhost:5173';
const TIMEOUT_MINS = parseInt(process.env.SESSION_TIMEOUT_MINS ?? '120');

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
	rainIntesity: 'ACC_NO_RAIN',
	rainIntensityIn10min: 'ACC_DRIZZLE',
	rainIntensityIn30min: 'ACC_LIGHT_RAIN'
};

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
