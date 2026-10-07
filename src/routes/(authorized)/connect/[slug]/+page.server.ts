import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getRigById, attemptRigConnection } from '$lib/queries/rig';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { supabase, safeGetSession } = locals;
	const session = await safeGetSession();

	const rig = await getRigById(supabase, params.slug);

	if (!rig) {
		throw error(404, 'Rig not found');
	}

	return {
		rig,
		rigId: params.slug,
		session
	};
};

export const actions: Actions = {
	default: async ({ locals: { supabase, safeGetSession }, params }) => {
		const { user } = await safeGetSession();
		if (!user) {
			const redirectTo = encodeURIComponent(`/connect/${params.slug}`);
			redirect(303, `/login?redirectTo=${redirectTo}`);
		}

        console.log('Attempting to connect user to rig:', params.slug, 'user id:', user.id);

		await attemptRigConnection(supabase, params.slug, user.id);

		throw redirect(303, `/connect/${params.slug}/session`);
	}
};
