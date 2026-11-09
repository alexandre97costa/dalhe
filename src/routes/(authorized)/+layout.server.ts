import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
	const { session, user } = await safeGetSession();

	return {
		session,
		user,
		// Read by +layout.ts to build the server-side Supabase client during SSR.
		cookies: cookies.getAll()
	};
};
