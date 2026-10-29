import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getRigStatus } from '$lib/queries/rig';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	const status = await getRigStatus(supabase, params.slug);

	if (!status) {
		throw error(404, 'Rig not found');
	}

	if (user && status.session_active && status.driver_id === user.id) {
		throw redirect(303, `/connect/${params.slug}/lounge`);
	}

	return {
		rig: { id: status.rig_id, name: status.rig_name },
		status,
		rigId: params.slug,
		session
	};
};

export const actions: Actions = {
	default: async ({ locals: { supabase, safeGetSession }, params }) => {
		const { user } = await safeGetSession();

		// ! TODO
		if (!user) {
			const redirectTo = encodeURIComponent(`/connect/${params.slug}`);
			redirect(303, `/login?redirectTo=${redirectTo}`);
		}

		console.log('Attempting to connect user to rig:', params.slug, 'user id:', user.id);

		// await connectToRig(supabase, params.slug, user.id);

		throw redirect(303, `/connect/${params.slug}/lounge`);
	}
};
