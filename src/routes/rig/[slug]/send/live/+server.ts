import { json } from '@sveltejs/kit';
import { sendRigStats_Lap } from '$lib/queries/rig';
import type { LapStats } from '$lib/types/rig_types';

/*
This route is used by the rig to send stats through a GET request. 
The rig will send its stats as query parameters, 
and the server will update the rig's stats in the database. 
*/

export async function GET({ url, locals, params }): Promise<Response> {
    const { supabase, safeGetSession } = locals;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Live lap stats (/rig/${params.slug})`);



    const stats: LapStats = {
        lapNumber: parseInt(url.searchParams.get('lapNumber') || '0'),
        lapTotalCount: parseInt(url.searchParams.get('lapNumber')|| '0'),
        laptime_ms: parseInt(url.searchParams.get('lapNumber') || '0'),
        deltaBest: parseInt(url.searchParams.get('lapNumber') || '0'),
        progress: parseInt(url.searchParams.get('lapNumber') || '0'), /* Progress from 0 to 1. */
        valid: (url.searchParams.get('lapNumber') === 'true'),
        currentSector: parseInt(url.searchParams.get('lapNumber') || '0'),
        currentSplit: parseInt(url.searchParams.get('lapNumber') || '0'),
        s1_ms: parseInt(url.searchParams.get('lapNumber') || '0'),
        s2_ms: parseInt(url.searchParams.get('lapNumber') || '0'),
        bestS1_ms: parseFloat(url.searchParams.get('lapNumber') || '0'),
        bestS2_ms: parseFloat(url.searchParams.get('lapNumber') || '0'),
        bestS3_ms: parseFloat(url.searchParams.get('lapNumber') || '0'),
    };

    const sendRigStatsResult = await sendRigStats_Lap(supabase, params.slug, stats);

    return json({
        message: 'Stats updated successfully',
    });
}