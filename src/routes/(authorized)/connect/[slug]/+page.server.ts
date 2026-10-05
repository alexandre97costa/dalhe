import { error, redirect } from '@sveltejs/kit'; 
import type { PageServerLoad } from './$types';
import { getDriverById, getDriverTimeline, getDriverStats } from '$lib/queries/driver';
import type { RecentLaptime } from '$lib/types/listings';
import { superValidate } from "sveltekit-superforms";
import { driverSchema } from '$lib/schemas/driverSchema';
import { zod4 } from "sveltekit-superforms/adapters";

export const load: PageServerLoad = async ({ locals, params }) => {
    const { supabase, safeGetSession } = locals;
    const session = await safeGetSession();

    /*
    This is the homepage for when the driver scans a QR Code on the rig. 
    
    If the driver is not connected to the rig, they will be shown a button to connect to the rig.
    If the driver is already connected to the rig, they will be redirected to the rig's page. 
    */

    return { 
        
    };
}