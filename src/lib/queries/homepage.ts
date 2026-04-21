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

    return data;
}