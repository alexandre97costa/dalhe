import { error, redirect } from '@sveltejs/kit'; 
import type { PageServerLoad } from './$types';
import { getDriverById, getDriverTimeline, getDriverStats } from '$lib/queries/driver';
import type { RecentLaptime } from '$lib/types/listings';

export const load: PageServerLoad = async ({ locals, params }) => {
    const { supabase, safeGetSession } = locals;
    const session = await safeGetSession();

    console.log('Loading driver page for slug:', params.slug);

    const driverRecentLaptimes = await getDriverTimeline(supabase, params.slug);
    const driver = await getDriverById(supabase, params.slug);
    const stats = await getDriverStats(supabase, params.slug);

    return { 
        slug: params.slug, 
        laptimes: driverRecentLaptimes,
        driver,
        session,
        stats
    };
}