// the query for the homepage data
// the most recent laptimes, no matter the track or car
// can be filtered by car category (and soon™ by All|Friends)

import { supabase } from '$lib/supabaseClient';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import type { RecentLaptime } from '../types/listings';

export async function getRecentLaptimes(supabaseClient: typeof supabase) {
    const { data, error } = await supabaseClient
        .from("listing_recent_laptimes")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;



    // TODO: laptime_best should be the best laptime for that track/car/driver combo, not just the current laptime
    const flattened: RecentLaptime[] = data?.map((item) => ({
        created_at: item.created_at,
        driver: item.driver,
        car_make: item.car_make,
        car_model: item.car_model,
        track_name: item.track_name,
        laptime: item.laptime,
        previous_laptime: item.previous_laptime,
        is_personal_best: item.is_personal_best,
        is_track_record: item.is_track_record,
    })) ?? [];

    return flattened;

}