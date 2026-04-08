import { supabase } from '$lib/supabaseClient';
import { GET_TEST_RECORDS } from '$env/static/private';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import type { RecentLaptime } from '$lib/types/listings';

export async function getDriverById(
    supabaseClient: typeof supabase,
    driverId: string) {

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', driverId)
        .single();
    if (error) throw error;
    return data;
}

export async function getDriverTimeline(
    supabaseClient: typeof supabase,
    driverId: string) {

    const { data, error } = await supabaseClient
        .rpc("get_driver_timeline", {
            driverid: driverId,
            testing: GET_TEST_RECORDS === "true"
        });
    if (error) throw error;

    return data;
}

export async function getDriverTrackLeaderboard(
    supabaseClient: typeof supabase,
    driverId: number,
    trackId: number,
    categoryId?: number) {

}