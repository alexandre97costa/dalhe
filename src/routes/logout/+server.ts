import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Sign out: POST only, so a link or a prefetch can't log anyone out.
// signOut() clears the auth cookies through the hook's cookie adapter.
export const POST: RequestHandler = async ({ locals: { supabase } }) => {
	const { error } = await supabase.auth.signOut();
	if (error) {
		console.log('Sign out error:', error.message);
	}
	redirect(303, '/');
};
