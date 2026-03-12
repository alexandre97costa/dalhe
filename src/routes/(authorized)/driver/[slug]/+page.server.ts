import { error } from '@sveltejs/kit'; 
import type { PageServerLoad } from './$types';
import { getDriverTimeline, getDriverById } from '$lib/queries/driver';

export const load: PageServerLoad = async ({ locals, params }) => {
    const { supabase, safeGetSession } = locals;
    const session = await safeGetSession();

    if (!session) return { data: { recentLaptimes: [] } };

    const driver = await getDriverById(supabase, parseInt(params.slug));
    if (!driver?.id) {
        throw error(404, 'Driver not found');
    }

    const leaderboardEntries = await getDriverTimeline(supabase, parseInt(params.slug));
    return { laptimes: leaderboardEntries, slug: params.slug };
}