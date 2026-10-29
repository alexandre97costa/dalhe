import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { connectToRig, getRigStatus } from '$lib/queries/rig';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { supabase, safeGetSession } = locals;
	const { user } = await safeGetSession();

	const status = await getRigStatus(supabase, params.slug);
	if (!status) {
		throw error(404, 'Rig not found');
	}

	// Already driving: nothing to connect to.
	if (user && status.session_active && status.driver_id === user.id) {
		throw redirect(303, `/connect/${params.slug}/lounge`);
	}

	return { status };
};

export const actions: Actions = {
	default: async ({ locals: { supabase, safeGetSession }, params, request }) => {
		const { user } = await safeGetSession();
		if (!user) {
			const redirectTo = encodeURIComponent(`/connect/${params.slug}`);
			throw redirect(303, `/login?redirectTo=${redirectTo}`);
		}

		const status = await getRigStatus(supabase, params.slug);
		if (!status) {
			throw error(404, 'Rig not found');
		}

		const form = await request.formData();
		const expectedDriverId = (form.get('expected_driver_id') as string | null) || null;
		const confirmed = form.get('confirm') === 'yes';

		// Taking over from another driver needs a second, deliberate press.
		const otherDriver = status.driver_id && status.driver_id !== user.id;
		if (otherDriver && !confirmed && expectedDriverId === status.driver_id) {
			return fail(409, { status, reason: 'confirm' as const });
		}

		const result = await connectToRig(supabase, status.rig_id, expectedDriverId);
		if (result === 'driver_changed') {
			// Someone connected after the page loaded: show who, and ask again.
			const current = (await getRigStatus(supabase, params.slug)) ?? status;
			return fail(409, { status: current, reason: 'driver_changed' as const });
		}

		throw redirect(303, `/connect/${params.slug}/lounge`);
	}
};
