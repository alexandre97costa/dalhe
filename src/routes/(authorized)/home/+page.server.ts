import type { PageServerLoad } from './$types';
import { getRecentLaptimes } from '$lib/queries/homepage';
import { getMyRigs } from '$lib/queries/rig';
import type { HomeRigs } from '$lib/types/home';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = locals;

	// Both awaited: no skeleton on the homepage (Sprint 2, U1).
	const [recentLaptimes, myRigs] = await Promise.all([
		getRecentLaptimes(supabase),
		getMyRigs(supabase)
	]);

	// The rig the user drives is the red carpet: split out, so the page doesn't search for it.
	const driving = myRigs.find((rig) => rig.driverIsMe) ?? null;
	const rigs: HomeRigs = {
		driving,
		others: myRigs.filter((rig) => rig !== driving)
	};

	return { laptimes: recentLaptimes, rigs };
};
