// queries related to any kind of leaderboards
// e.g., track leaderboards, car leaderboards, etc.

import { supabase } from '$lib/supabaseClient';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import type { LeaderboardEntry } from '../types/listings';

export async function getTrackLeaderboard(supabaseClient: typeof supabase, track: number) {
    const { data, error } = await supabaseClient
        .rpc("get_leaderboard_by_track", { track });
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
        .select('id, name');
    if (error) throw error;
    return data;
}