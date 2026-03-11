import { error } from '@sveltejs/kit'; 
import type { PageServerLoad } from './$types';
import { getTrackLeaderboard, getTrackIdBySlug, getAllTracks, getAllCategories } from '$lib/queries/leaderboards';

export const load: PageServerLoad = async ({ locals, url }) => {
    const { supabase, safeGetSession } = locals;
    const session = await safeGetSession();

    if (!session) return { data: { laptimes: [] } };

    const allTracks = await getAllTracks(supabase);
    const allCategories = await getAllCategories(supabase);

    // grab filter values from the query string; we'll fall back to the first
    // item in each list if nothing was provided so the UI always has a selection
    let trackId: number | undefined;
    let categoryId: number | undefined;

    const trackParam = url.searchParams.get('track');
    const categoryParam = url.searchParams.get('category');
    if (trackParam) {
        trackId = parseInt(trackParam, 10);
    }
    if (categoryParam) {
        categoryId = parseInt(categoryParam, 10);
    }

    if (!trackId && allTracks?.length) {
        trackId = allTracks[0].id;
    }
    if (!categoryId && allCategories?.length) {
        categoryId = allCategories[0].id;
    }

    const leaderboardEntries = await getTrackLeaderboard(supabase, trackId!, categoryId);
    return {
        laptimes: leaderboardEntries,
        tracks: allTracks,
        categories: allCategories,
        selectedTrackId: trackId,
        selectedCategoryId: categoryId
    };
}