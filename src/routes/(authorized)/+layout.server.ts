import type { LayoutServerLoad } from './$types';
import { getManualLapsEnabled } from '$lib/queries/manualLaps';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, cookies }) => {
	const { session, user } = await safeGetSession();

	return {
		session,
		user,
		// The "Add lap" link in the user menu (manual laps fallback, app_settings).
		manualLapsEnabled: user ? await getManualLapsEnabled(supabase) : false,
		// Read by +layout.ts to build the server-side Supabase client during SSR.
		cookies: cookies.getAll()
	};
};
