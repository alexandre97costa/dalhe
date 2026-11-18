import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import * as z from 'zod';
import { getActivity } from '$lib/queries/homepage';
import { getMyRigs } from '$lib/queries/rig';
import type { HomeRigs } from '$lib/types/home';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = locals;

	// Both awaited: no skeleton on the homepage (Sprint 2, U1).
	const [activity, myRigs] = await Promise.all([getActivity(supabase), getMyRigs(supabase)]);

	// The rig the user drives is the red carpet: split out, so the page doesn't search for it.
	const driving = myRigs.find((rig) => rig.driverIsMe) ?? null;
	const rigs: HomeRigs = {
		driving,
		others: myRigs.filter((rig) => rig !== driving)
	};

	return { activity, rigs };
};

// The Activity cursor as the Load more form posts it: the last lap shown.
const cursorSchema = z.object({
	createdAt: z.iso.datetime({ offset: true }),
	lapId: z.coerce.number().int().positive()
});

export const actions: Actions = {
	// The next page of the Activity feed, after the posted cursor.
	loadMore: async ({ locals: { supabase }, request }) => {
		const parsed = cursorSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { invalidCursor: true });

		const { laps, nextCursor } = await getActivity(supabase, { before: parsed.data });
		return { laps, nextCursor };
	}
};
