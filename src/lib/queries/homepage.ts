// the query for the homepage data
// the most recent laptimes, no matter the track or car
// can be filtered by car category (and soon™ by All|Friends)

import { supabase } from '$lib/supabaseClient';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import type { RecentLaptime } from '../types/listings';

export async function getRecentLaptimes(supabaseClient: typeof supabase) {
    const { data, error } = await supabaseClient
        .from("lap_time")
        .select(`
            id,
            laptime_ms:time_milliseconds,
            laptime_parsed:time_parsed,
            created_at,
            race_track (
                track_id:id,
                track:name
            ),
            car (
                car_id:id,
                car_model:model,
                car_make (
                    car_make:name
                )
            ),
            profiles (
                driver_id:id,
                driver:username,
                driver_avatar:avatar_url
            )
            
        `)
        .order("created_at", { ascending: false })
        .limit(10);
    if (error) throw error;


    const flattened: RecentLaptime[] = data?.map((item) => ({
        id: item.id,
        laptime_ms: item.laptime_ms,
        laptime_parsed: item.laptime_parsed,
        created_at: item.created_at,
        track_id: item.race_track.track_id,
        track: item.race_track.track,
        car_id: item.car.car_id,
        car_model: item.car.car_model,
        car_make: item.car.car_make.car_make,
        driver_id: item.profiles.driver_id,
        driver: item.profiles.driver,
        driver_avatar: item.profiles.driver_avatar
    })) ?? [];

    return flattened;

}