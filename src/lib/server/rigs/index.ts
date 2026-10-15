import { SESSION_TIMEOUT_MINS } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { json } from '@sveltejs/kit';
import * as z from "zod"; 
import { type SessionStats, type LapStats, type NewLap, NewLapSchema } from '$lib/types/rig';
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

    const uuid = z.uuid({version: 'v4'});
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

// receive stuff from rig

// take a RouteParams object and a schema, and return the validation result (dont throw)

