import type { PageServerLoad } from './$types';
import type { RecentLaptime } from '$lib/types/listings';
import { getRecentLaptimes } from '$lib/queries/homepage';

export const load: PageServerLoad = async ({ locals }) => {
    const { supabase, safeGetSession } = locals;
    const session = await safeGetSession();

    if (!session) return { data: { recentLaptimes: [] } };
    const recentLaptimes = await getRecentLaptimes(supabase);
    return { laptimes: recentLaptimes };
}