// SimHub id check: lists catalog cars and tracks without a SimHub id (`car.simhub_carid`,
// `race_track.simhub_trackid` null or empty) and how many laps each has. A lap on an unmapped car
// or track is rejected by /send/new, so every car and track in use needs one (Sprint 1.5, Decision 4).
// Run with `pnpm simhub:check`. Read-only, against the local stack only. Exits 1 when something is missing.
//
// For the hosted database, run the same check in the dashboard's SQL editor:
//
//   select 'car' as kind, c.id, concat_ws(' ', m.name, c.model, c.year) as name,
//     (select count(*) from public.lap_time l where l.car_id = c.id) as laps
//   from public.car c join public.car_make m on m.id = c.make_id
//   where nullif(trim(c.simhub_carid), '') is null
//   union all
//   select 'track', t.id, t.name,
//     (select count(*) from public.lap_time l where l.track_id = t.id)
//   from public.race_track t
//   where nullif(trim(t.simhub_trackid), '') is null
//   order by kind, laps desc, name;
import { createClient } from '@supabase/supabase-js';

// Same guard as the fake rig: only ever the local stack.
function assertLocal(url, what) {
	const host = new URL(url).hostname;
	if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) {
		console.error(`Refusing to run: ${what} is ${host}, not the local stack.`);
		process.exit(2);
	}
}
assertLocal(process.env.PUBLIC_SUPABASE_URL ?? 'http://missing', 'PUBLIC_SUPABASE_URL in .env');

// Service role: the catalog and lap_time aren't readable by anon. Selects only.
const db = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
	auth: { persistSession: false }
});

const unmapped = (id) => id === null || id.trim() === '';

async function lapCount(column, id) {
	const { count, error } = await db
		.from('lap_time')
		.select('id', { count: 'exact', head: true })
		.eq(column, id);
	if (error) throw error;
	return count ?? 0;
}

async function missing(kind) {
	const { data, error } =
		kind === 'car'
			? await db.from('car').select('id, model, year, simhub_carid, car_make(name)')
			: await db.from('race_track').select('id, name, simhub_trackid');
	if (error) throw error;

	const rows = data
		.filter((r) => unmapped(kind === 'car' ? r.simhub_carid : r.simhub_trackid))
		.map((r) => ({
			id: r.id,
			name: kind === 'car' ? [r.car_make?.name, r.model, r.year].join(' ') : r.name
		}));
	for (const row of rows) row.laps = await lapCount(kind === 'car' ? 'car_id' : 'track_id', row.id);
	rows.sort((a, b) => b.laps - a.laps || a.name.localeCompare(b.name));
	return { total: data.length, rows };
}

let anyMissing = false;
for (const [kind, label] of [
	['car', 'Cars'],
	['track', 'Tracks']
]) {
	const { total, rows } = await missing(kind);
	console.log(`${label} without a SimHub id: ${rows.length} of ${total}`);
	for (const r of rows) {
		const laps = r.laps > 0 ? `${r.laps} laps` : 'no laps';
		console.log(`  ${String(r.id).padStart(4)}  ${r.name}  (${laps})`);
	}
	if (rows.length > 0) anyMissing = true;
}
process.exit(anyMissing ? 1 : 0);
