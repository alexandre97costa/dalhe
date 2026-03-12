import { error } from '@sveltejs/kit'; 
import type { PageServerLoad } from './$types';
import { getDriverTimeline, getDriverById } from '$lib/queries/driver';
import type { RecentLaptime } from '$lib/types/listings';

export const load: PageServerLoad = async ({ locals, params }) => {
    const { supabase, safeGetSession } = locals;
    const session = await safeGetSession();

    if (!session) return { data: { recentLaptimes: [] } };

    console.log('Loading driver page for slug:', params.slug);

    const driverRecentLaptimes = await getDriverTimeline(supabase, params.slug);

    return { laptimes: driverRecentLaptimes, slug: params.slug };
}