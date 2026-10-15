import { supabase } from '$lib/supabaseClient';
import { GET_TEST_RECORDS } from '$env/static/private';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import type { RecentLaptime } from '$lib/types/listings';
import type { SessionStats, LapStats } from '$lib/types/rig';

export async function getRigById(
    supabaseClient: typeof supabase,
    rigId: string) {
    const { data, error } = await supabaseClient
        .from('rig')
        .select(`
            id,
            name,
            rig_session (
                profiles (
                    id,
                    username    
                )
            )
        `)
        .eq('id', rigId)
        .is('rig_session.ended_at', null)
        .single();

    if (error && error?.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
        id: data.id,
        name: data.name,
        driver_id: data.rig_session?.[0]?.profiles?.id ?? null,
        driver_name: data.rig_session?.[0]?.profiles?.username ?? null
    };
}

export async function sendRigStats_Session(
    supabaseClient: typeof supabase,
    rigId: string,
    stats: SessionStats) {

    const { error } = await supabaseClient
        .from('rig_stats')
        .update({
            session_stats: stats,
            session_updated_at: new Date().toISOString()
        })
        .eq('id', rigId);
    if (error) throw error;

}

export async function sendRigStats_Lap(
    supabaseClient: typeof supabase,
    rigId: string,
    stats: LapStats) {

    const { error } = await supabaseClient
        .from('rig_stats')
        .update({
            lap_stats: stats,
            lap_updated_at: new Date().toISOString()
        })
        .eq('id', rigId);
    if (error) throw error;

}