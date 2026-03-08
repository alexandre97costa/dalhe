import type { Actions } from './$types';
import { superValidate } from "sveltekit-superforms";
import { laptimeSchema } from '$lib/schemas/laptimeSchema';
import { zod4 } from "sveltekit-superforms/adapters";
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, locals: { safeGetSession, supabase } }) => {
        console.log('Received form submission', request);

		const form = await superValidate(request, zod4(laptimeSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { session } = await safeGetSession();
		if (!session) {
			return fail(401, { form, error: 'Unauthorized' });
		}

		// Convert MM:SS.mmm format to milliseconds
		// Format: MM:SS:mmm (7 digits total)
		const [minutes, seconds, milliseconds] = [
			form.data.laptime.slice(0, 2),
			form.data.laptime.slice(2, 4),
			form.data.laptime.slice(4, 7)
		].map(Number);

		const timeMs = minutes * 60_000 + seconds * 1_000 + milliseconds;

		// Insert into database
		const { error } = await supabase.from('lap_time').insert({
			driver_id: session.user.id,
			car_id: parseInt(form.data.car_model),
			track_id: parseInt(form.data.race_track),
			time_milliseconds: timeMs
		});

		if (error) {
			return fail(500, { form, error: error.message });
		}

        console.log('Lap time submitted successfully');

		return { form };
	}
};
