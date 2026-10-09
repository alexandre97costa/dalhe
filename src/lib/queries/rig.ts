import { supabase } from '$lib/supabaseClient';
import { GET_TEST_RECORDS } from '$env/static/private';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import type { RecentLaptime } from '$lib/types/listings';

export async function attemptRigConnection(
    supabaseClient: typeof supabase,
    rigId: string,
    driverId: string) {

    // the function should 
    // 1) update the rig's connected_user and last_connection fields and 
    // 2) create/update on the n:m table rig_drivers, with the rig_id and driver_id, and a timestamp for the connection

    // TODO IMPORTANT: USE RPC RIG CONNECTION INSTEAD OF THIS FUNCTION, AS IT WILL HANDLE THE CONNECTION LOGIC AND VALIDATION ON THE SERVER SIDE

    // const { data: rigData, error: rigError } = await supabaseClient
    //     .from('rig')
    //     .update({
    //         connected_user: driverId,
    //         last_connection: new Date().toISOString()
    //     })
    //     .eq('id', rigId);
    // if (rigError) throw rigError;

    // const { data: driverData, error: driverError } = await supabaseClient
    //     .from('rig_drivers')
    //     .upsert({
    //         rig_id: rigId,
    //         driver_id: driverId,
    //         last_connected_at: new Date().toISOString()
    //     }, {
    //         onConflict: 'rig_id,driver_id',
    //     });

    // if (driverError) throw driverError;

    // return { message: 'User sucessfully connected to rig!' };
}

export async function getRigStats(
    supabaseClient: typeof supabase,
    rigId: string,
    driverId: string) {

    // check if driver is associated with rig in rig_drivers table
    const { data: rigDriverData, error: rigDriverError } = await supabaseClient
        .from('rig_drivers')
        .select('*')
        .eq('rig_id', rigId)
        .eq('driver_id', driverId)
        .single();

    if (rigDriverError) throw rigDriverError;

    const { data, error } = await supabaseClient
        .from('rig_stats')
        .select(`
            session_stats,
            lap_stats
        `)
        .eq('id', rigId)
        .single();
    if (error) throw error;
    return data;
}


export async function getRigById(
    supabaseClient: typeof supabase,
    rigId: string) {
    const { data, error } = await supabaseClient
        .from('rig')
        .select(`
            name,
            profiles (
                id,
                username
            )
        `)
        .eq('id', rigId)
        .single();
    if (error && error?.code !== 'PGRST116') throw error;
    return data;
}

export type RigStats = {
    session: {
        trackName: string;
        carName: string;
        trackTemperature: number;
        weather: string;
    };
    lap: {
        lapNumber: number;
        /** Progress from 0 to 1. */
        lapProgress: number;
        numberOfSectors: number;
        currentSector: number;
        currentSectorTime: number;
        currentLapTime: number;
        sectorTimes: Record<number, number>;
    };
};

export async function sendRigStats(
    supabaseClient: typeof supabase,
    rigId: string,
    stats: RigStats) {

    const { error } = await supabaseClient
        .from('rig_stats')
        .update({
            session_stats: stats.session,
            session_updated_at: new Date().toISOString(),
            lap_stats: stats.lap,
            lap_updated_at: new Date().toISOString()
        })
        .eq('id', rigId);
    if (error) throw error;

}