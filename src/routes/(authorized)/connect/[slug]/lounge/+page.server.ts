import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getRigById } from '$lib/queries/rig';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const { supabase, safeGetSession } = locals;
	const { session } = await safeGetSession();

	const rig = await getRigById(supabase, params.slug);

	if (!rig) {
		throw error(404, 'Rig not found');
	}

	const [statsResult, lapsResult, bestLapResult] = await Promise.all([
		supabase
			.from('rig_stats')
			.select('session_stats, lap_stats, session_updated_at, lap_updated_at')
			.eq('id', params.slug)
			.maybeSingle(),
		supabase
			.from('lap_time')
			.select('id, time_milliseconds, created_at')
			.eq('rig_id', params.slug)
			.order('created_at', { ascending: false })
			.limit(10),
		supabase
			.from('lap_time')
			.select('time_milliseconds')
			.eq('rig_id', params.slug)
			.order('time_milliseconds', { ascending: true })
			.limit(1)
			.maybeSingle()
	]);

	if (statsResult.error) throw statsResult.error;
	if (lapsResult.error) throw lapsResult.error;
	if (bestLapResult.error) throw bestLapResult.error;

	return {
		rig,
		rigId: params.slug,
		rigStats: statsResult.data,
		previousLaps: lapsResult.data,
		bestLap: bestLapResult.data?.time_milliseconds ?? null,
		activeTab: url.searchParams.get('tab') === 'unclaimed-laps' ? 'unclaimed-laps' : 'live-session',
		session
	};
};
