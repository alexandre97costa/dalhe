import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const { supabase, safeGetSession } = locals;
    const session = await safeGetSession();

    if (!session) return { recentLaptimes: [] };

    // TODO: query
    const { data: recentLaptimes, error } = await supabase
        .from('lap_time')
        .select(`
            id,
            created_at,
            racer:racers (
                id,
                username,
                avatar_url
            ),
            laptime,
            difference_to_first_ms,
            car:cars (
                id,
                make,
                model,
                year
            ),
            track:tracks (
                id,
                name
            ),
            conditions
        `)
        .order('created_at', { ascending: false })
        .limit(10);


    if (error) {
        console.error('Error fetching recent laptimes:', error);
        return {
            recentLaptimes: [],
        };
    }

    return { recentLaptimes };
}