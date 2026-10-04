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

    console.log('Trying to connect to rig:', params.slug);


    return { 
        
    };
}