// queries related to any kind of leaderboards
// e.g., track leaderboards, car leaderboards, etc.

import { supabase } from '$lib/supabaseClient';
import { GET_TEST_RECORDS } from '$env/static/private';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import type { LeaderboardEntry } from '../types/listings';

export async function getTrackLeaderboard(
    supabaseClient: typeof supabase,
    trackId: number,
    categoryId?: number
) {

    const { data, error } = await supabaseClient
        .rpc("get_leaderboard_by_track", { 
            track: trackId,
            category: categoryId ?? 1,
            testing: GET_TEST_RECORDS == 'true'
        });
    if (error) console.error('Error fetching track leaderboard:', error);
    if (error) throw error;

    return data;
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
        .select('id, name')
        .order('name', { ascending: true });
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