// src/routes/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { m } from '$lib/paraglide/messages.js';
import { LOGIN_REDIRECT_COOKIE, safeRedirectPath } from '$lib/server/loginRedirect';

export const actions: Actions = {
	default: async (event) => {
		const {
			url,
			request,
			cookies,
			locals: { supabase }
		} = event;
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const validEmail = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/.test(email);

		if (!validEmail) {
			return fail(400, { errors: { email: m.formlogin_email_error_pattern() }, email });
		}

		const { error } = await supabase.auth.signInWithOtp({ email });

		if (error) {
			return fail(400, {
				success: false,
				email,
				message: m.formlogin_submit_error()
			});
		}

		// The magic link can't carry it, so remember where to go back to after login.
		const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'));
		if (redirectTo) {
			cookies.set(LOGIN_REDIRECT_COOKIE, redirectTo, {
				path: '/',
				httpOnly: true,
				maxAge: 60 * 60
			});
		}

		return {
			success: true,
			message: m.formlogin_submit_success()
		};
	}
};
