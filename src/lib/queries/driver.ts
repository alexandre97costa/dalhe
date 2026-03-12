import { supabase } from '$lib/supabaseClient';
import { GET_TEST_RECORDS } from '$env/static/private';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import type { RecentLaptime } from '../types/listings';

export async function getDriverById(
    supabaseClient: typeof supabase,
    driverId: number) {

        return {id: 1}

}

export async function getDriverTimeline(
    supabaseClient: typeof supabase,
    driverId: number) {

}

export async function getDriverTrackLeaderboard(
    supabaseClient: typeof supabase,
    driverId: number,
    trackId: number,
    categoryId?: number) {

}