import { error } from '@sveltejs/kit'; 
import type { PageServerLoad } from './$types';
import { getTrackLeaderboard, getTrackIdBySlug, getAllTracks } from '$lib/queries/leaderboards';

export const load: PageServerLoad = async ({ locals, params }) => {
    const { supabase, safeGetSession } = locals;
    const session = await safeGetSession();

    if (!session) return { data: { laptimes: [] } };

    const allTracks = await getAllTracks(supabase);

    // replace with page state var SelectedTrackId
    const leaderboardEntries = await getTrackLeaderboard(supabase, 1);
    return { laptimes: leaderboardEntries, tracks: allTracks };
}