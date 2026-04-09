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

    // const { data: userData, error: userError } = await supabaseClient
    //     .schema('auth')
    //     .from('users')
    //     .select('*')
    //     .eq('id', driverId)
    //     .single();

    // if (userError) throw userError;

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

export async function getDriverStats(
    supabaseClient: typeof supabase,
    driverId: string) {

    // podiums
    const { data: podiumData, error: podiumError } = await supabaseClient
        .from('lap_time')
        .select('id.count()')
        .eq('driver_id', driverId)
        .eq('was_podium', true);
    if (podiumError) console.error({
        message: 'podium: ' + podiumError?.message,
        code: podiumError?.code,
        details: podiumError?.details
    });

    // poles
    const { data: poleData, error: poleError } = await supabaseClient
        .from('lap_time')
        .select('id.count()')
        .eq('driver_id', driverId)
        .gt('pole_rating', 0);
    if (poleError) console.error({
        message: 'pole: ' + poleError?.message,
        code: poleError?.code,
        details: poleError?.details
    });;

    // dominance (pole rating)
    const { data: dominanceData, error: dominanceError } = await supabaseClient
        .from('lap_time')
        .select('pole_rating.sum()')
        .eq('driver_id', driverId);
    if (dominanceError) console.error({
        message: 'dominance: ' + dominanceError?.message,
        code: dominanceError?.code,
        details: dominanceError?.details
    });;

    // laps submitted
    const { data: lapsData, error: lapsError } = await supabaseClient
        .from('lap_time')
        .select('id.count()')
        .eq('driver_id', driverId);
    if (lapsError) console.error({
        message: 'laps: ' + lapsError?.message,
        code: lapsError?.code,
        details: lapsError?.details
    });

    return {
        podiums: podiumData ? podiumData[0].count : 0,
        poles: poleData ? poleData[0].count : 0,
        dominance: dominanceData ? dominanceData[0].sum : 0,
        totalLaps: lapsData ? lapsData[0].count : 0
    }
}

export async function getDriverTrackLeaderboard(
    supabaseClient: typeof supabase,
    driverId: number,
    trackId: number,
    categoryId?: number) {

}