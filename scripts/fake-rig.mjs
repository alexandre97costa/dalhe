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
	console.log(`  GET /rig/${rigId}${path}?${shown}${keyShown}`);
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
	'stale-session': {
		about: 'poll while the session is past the timeout: inactive, nothing written',
		async run(rig) {
			const db = admin();
			const { data: open, error } = await db
				.from('rig_session')
				.select('id, last_activity_at')
				.eq('rig_id', rig.id)
				.is('ended_at', null)
				.maybeSingle();
			if (error) throw error;

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
				const r = await call(rig);
				const { data: after } = await db
					.from('rig_session')
					.select('ended_at')
					.eq('id', sessionId)
					.single();
				return r.status === 200 && r.body?.sessionActive === false && after?.ended_at === null;
			} finally {
				// Put the rig back the way it was
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
