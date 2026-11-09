import type { TypedSupabaseClient } from '$lib/types/supabase';
import { GET_TEST_RECORDS } from '$env/static/private';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js';
import type { RecentLaptime } from '$lib/types/listings';

export async function getDriverById(supabaseClient: TypedSupabaseClient, driverId: string) {
	const { data, error } = await supabaseClient
		.from('profiles')
		.select('*')
		.eq('id', driverId)
		.single();
	if (error) throw error;

	// const { data: userData, error: userError } = await supabaseClient
	//     .schema('auth')
	//     .from('users')
	//     .select('*')
	//     .eq('id', driverId)
	//     .single();

	// if (userError) throw userError;

	return data;
}

export async function getDriverTimeline(supabaseClient: TypedSupabaseClient, driverId: string) {
	const { data, error } = await supabaseClient.rpc('get_driver_timeline', {
		driverid: driverId,
		testing: GET_TEST_RECORDS === 'true'
	});
	if (error) throw error;

	return data;
}

export async function getDriverStats(supabaseClient: TypedSupabaseClient, driverId: string) {
	const { data, error } = await supabaseClient
		.rpc('get_driver_stats', {
			p_driver_id: driverId,
			p_testing: GET_TEST_RECORDS === 'true'
		})
		.single();
	if (error) throw error;

	return {
		podiums: data.podiums,
		poles: data.poles,
		dominance: data.dominance,
		totalLaps: data.total_laps
	};
}

export async function getDriverTrackLeaderboard(
	supabaseClient: TypedSupabaseClient,
	driverId: number,
	trackId: number,
	categoryId?: number
) {}
