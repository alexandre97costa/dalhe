// queries related to any kind of leaderboards
// e.g., track leaderboards, car leaderboards, etc.

import { supabase } from '$lib/supabaseClient';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import type { LeaderboardEntry } from '../types/listings';

export async function getTrackLeaderboard(
    supabaseClient: typeof supabase,
    track: number,
    categoryId?: number
) {
    // rather than relying on the RPC we use a regular PostgREST query so we can
    // optionally filter by car category. the RPC defined in the database only
    // returns make/model/driver/laptime, so there is no way to restrict on
    // category without modifying the function in the database.
    
    let query = supabaseClient
        .from('lap_time')
        .select(
            `
            created_at,
            driver:driver_id(username),
            car:car_id(id,model,make:make_id(name),category_id),
            time_milliseconds
            `
        )
        .eq('track_id', track)
        .order('time_milliseconds', { ascending: true });

    if (categoryId) {
        // PostgREST supports filtering through joins using dot notation
        query = query.eq('car.category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // convert the raw row shape into the existing LeaderboardEntry interface
    return (
        data as any[] // we know the shape above but PostgREST typings are awkward
    ).map((r, i) => ({
        rank: i + 1,
        created_at: r.created_at,
        driver: r.driver.username,
        car_make: r.car?.make?.name,
        car_model: r.car?.model,
        laptime: r.time_milliseconds,
    }));
}

export async function getTrackIdBySlug(supabaseClient: typeof supabase, slug: string) {
    const { data, error } = await supabaseClient
        .from('race_track')
        .select('id')
        .ilike('name', slug)
        .single();
    if (error) throw error;
    return data?.id;
}

export async function getAllTracks(supabaseClient: typeof supabase) {
    const { data, error } = await supabaseClient
        .from('race_track')
        .select('id, name');
    if (error) throw error;
    return data;
}

export async function getAllCategories(supabaseClient: typeof supabase) {
    const { data, error } = await supabaseClient
        .from('car_category')
        .select('id, name');
    if (error) throw error;
    return data;
}