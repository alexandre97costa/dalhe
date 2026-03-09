import { error } from '@sveltejs/kit'; 
import type { PageServerLoad } from './$types';
import { getTrackLeaderboard, getTrackIdBySlug } from '$lib/queries/leaderboards';

export const load: PageServerLoad = async ({ locals, params }) => {
    const { supabase, safeGetSession } = locals;
    const session = await safeGetSession();

    if (!session) return { data: { recentLaptimes: [] } };

    const trackId = await getTrackIdBySlug(supabase, params.slug);
    if (!trackId) {
        throw error(404, 'Track not found');
    }

    const leaderboardEntries = await getTrackLeaderboard(supabase, trackId);
    return { laptimes: leaderboardEntries, slug: params.slug };
}