// Manual laps: the fallback for when the SimHub overlay can't send laps.
// Only exists while app_settings.manual_laps_enabled is on; insert_manual_lap checks it too.
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { m } from '$lib/paraglide/messages.js';
import { manualLapSchema } from '$lib/schemas/manualLapSchema';
import { digitsToMilliseconds, lastSectorMilliseconds } from '$lib/utils/laptime';
import {
	getManualLapCatalog,
	getManualLapsEnabled,
	insertManualLap,
	type ManualLapStatus
} from '$lib/queries/manualLaps';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	if (!(await getManualLapsEnabled(supabase))) error(404);

	const catalog = await getManualLapCatalog(supabase);
	// One game in the catalog: it's the only answer, so it starts selected.
	const onlyGame = catalog.games.length === 1 ? String(catalog.games[0].id) : '';
	const form = await superValidate({ game_id: onlyGame }, zod4(manualLapSchema), {
		errors: false
	});

	return { form, ...catalog };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) error(401);

		const form = await superValidate(request, zod4(manualLapSchema));
		if (!form.valid) return fail(400, { form });

		// The schema already checked these parse and that S3 stays above zero.
		const lapMs = digitsToMilliseconds(form.data.laptime)!;
		const s1Ms = digitsToMilliseconds(form.data.s1);
		const s2Ms = digitsToMilliseconds(form.data.s2);
		const s3Ms = lastSectorMilliseconds(lapMs, s1Ms, s2Ms);

		let status: ManualLapStatus;
		try {
			status = await insertManualLap(supabase, {
				gameId: Number(form.data.game_id),
				trackId: Number(form.data.track_id),
				carId: Number(form.data.car_id),
				lapMs,
				sectorsMs: s1Ms !== null && s2Ms !== null && s3Ms !== null ? [s1Ms, s2Ms, s3Ms] : null
			});
		} catch (e) {
			// e.g. a car or track id that isn't in the catalog (foreign key)
			console.error('Manual lap insert error:', e instanceof Error ? e.message : e);
			return message(form, 'error', { status: 400 });
		}

		switch (status) {
			case 'created':
				// Keep game, track and car for the next lap; clear the times.
				form.data.laptime = '';
				form.data.s1 = '';
				form.data.s2 = '';
				return message(form, 'created');
			case 'duplicate':
				return setError(form, 'laptime', m.manuallap_error_duplicate());
			case 'sectors_mismatch':
				return setError(form, 's2', m.manuallap_error_sectors_sum());
			case 'disabled':
				return message(form, 'disabled', { status: 403 });
		}
	}
};
