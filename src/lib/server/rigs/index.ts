import { SESSION_TIMEOUT_MINS } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { json } from '@sveltejs/kit';
import * as z from "zod";
import { type SessionStats, type LapStats, type NewLapConverted, zNewLapConverted } from '$lib/types/rig';
import { formatLaptime, convertTimeStringToMilliseconds, formatTimeSinceCreation, compareLaptimes } from '$lib/utils/laptime';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export function rigJson<T>(body: T, status = 200): Response {
    return json(body, { status, headers: NO_STORE });
}

// One fixed body for every "can't find it" case: unknown rig, malformed UUID.
// Never include the id or a reason, or you leak whether the rig exists.
export function rigNotFound(): Response {
    return rigJson({ error: 'not_found' }, 404);
}

export async function resolveRig(
    rigId: string):
    Promise<{
        driver_id: string
        driver_name: string
        rig_id: string
        rig_name: string
        session_active: boolean
        session_id: string
    } | null> {

    const uuid = z.uuid({ version: 'v4' });
    const validate = uuid.safeParse(rigId);
    if (!validate.success) return null;


    const { data, error } = await supabaseAdmin
        .rpc('rig_status', {
            p_expiry_minutes: parseInt(SESSION_TIMEOUT_MINS),
            p_rig_id: rigId
        });

    console.log('resolveRig data:', data);
    console.log('resolveRig error:', error);
    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0];
}

export async function resolveCar(
    carId: string):
    Promise<{
        car_id: string
    } | null> {

    const uuid = z.uuid({ version: 'v4' });
    const validate = uuid.safeParse(carId);
    if (!validate.success) return null;

    const { data, error } = await supabaseAdmin
        .from('car')
        .select('car_id:id')
        .eq('simhub_carid', carId)
        .single();

    if (error) return null;
    return data
}

export async function resolveTrack(
    trackId: string):
    Promise<{
        track_id: string
    } | null> {

    const uuid = z.uuid({ version: 'v4' });
    const validate = uuid.safeParse(trackId);
    if (!validate.success) return null;

    const { data, error } = await supabaseAdmin
        .from('race_track')
        .select('track_id:id')
        .eq('simhub_trackid', trackId)
        .single();

    if (error) return null;
    return data
}

export function validateRouteParams<T extends z.ZodType>(
    params: URLSearchParams,
    schema: T
) {
    return schema.safeParse(Object.fromEntries(params));
}

export async function insertNewLap(
    l: NewLapConverted): 
    Promise<{ lap_id: string } | null> {

    const { data, error } = await supabaseAdmin
        .rpc('insert_new_lap', {
            p_timeout_minutes: parseInt(SESSION_TIMEOUT_MINS),
            p_rig_id: l.rigId,
            p_lap_time_ms: l.laptime_ms,
            p_s1_ms: l.s1_ms,
            p_s2_ms: l.s2_ms,
            p_s3_ms: l.s3_ms,
            p_car_id: l.carId,
            p_track_id: l.trackId
        });

    if (error) return null;
    return data;

}