import { json } from '@sveltejs/kit';
import { type RigStats, sendRigStats } from '$lib/queries/rig';

/*
This route is used by the rig to send stats through a GET request. 
The rig will send its stats as query parameters, 
and the server will update the rig's stats in the database. 
*/

export async function GET({ url, locals, params }): Promise<Response> {
    const { supabase, safeGetSession } = locals;
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] GET request received. /rig/${params.slug}`);

    const stats: RigStats = {
        session: {
            trackName: url.searchParams.get('trackName') || '',
            carName: url.searchParams.get('carName') || '',
            trackTemperature: parseFloat(url.searchParams.get('trackTemperature') || '0'),
            weather: url.searchParams.get('weather') || ''
        },
        lap: {
            lapNumber: parseInt(url.searchParams.get('lapNumber') || '0'),
            lapProgress: parseFloat(url.searchParams.get('lapProgress') || '0'),
            numberOfSectors: parseInt(url.searchParams.get('numberOfSectors') || '0'),
            currentSector: parseInt(url.searchParams.get('currentSector') || '0'),
            currentSectorTime: parseFloat(url.searchParams.get('currentSectorTime') || '0'),
            currentLapTime: parseFloat(url.searchParams.get('currentLapTime') || '0'),
            sectorTimes: {}
        }
    };

	const rig = await sendRigStats(supabase, params.slug, stats);

	return json({
        message: 'Stats updated successfully',
    });
}