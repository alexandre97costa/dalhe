import type { TypedSupabaseClient } from '$lib/types/supabase';
import { GET_TEST_RECORDS } from '$env/static/private';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js';
import type { RecentLaptime } from '$lib/types/listings';

export async function connectToRig(
	supabaseClient: TypedSupabaseClient,
	rigId: string,
	driverId: string
) {
	const { data, error } = await supabaseClient.rpc('connect_to_rig', {
		p_rig_id: rigId,
		p_driver_id: driverId
	});

	if (error) throw error;
	return data;
}

export async function getRigStats(
	supabaseClient: TypedSupabaseClient,
	rigId: string,
	driverId: string
) {
	// check if driver is associated with rig in rig_drivers table
	const { data: rigDriverData, error: rigDriverError } = await supabaseClient
		.from('rig_drivers')
		.select('*')
		.eq('rig_id', rigId)
		.eq('driver_id', driverId)
		.single();

	if (rigDriverError) throw rigDriverError;

	const { data, error } = await supabaseClient
		.from('rig_stats')
		.select(
			`
            session_stats,
            lap_stats
        `
		)
		.eq('id', rigId)
		.single();
	if (error) throw error;
	return data;
}
