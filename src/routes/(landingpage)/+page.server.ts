// src/routes/+page.server.ts
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { m } from '$lib/paraglide/messages.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();

	console.log(session)

	// if the user is already logged in return them to the account page
	if (session) {
		// redirect(303, '/account')
	}

	return { url: url.origin }
}

export const actions: Actions = {
	default: async (event) => {
		const {
			url,
			request,
			locals: { supabase }
		} = event
		const formData = await request.formData()
		const email = formData.get('email') as string
		const validEmail = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/.test(email)

		if (!validEmail) {
			return fail(400, { errors: { email: m.formlogin_email_error_pattern()}, email })
		}

		const { error } = await supabase.auth.signInWithOtp({ email })

		if (error) {
			return fail(400, {
				success: false,
				email,
				message: m.formlogin_submit_error()
			})
		}

		return {
			success: true,
			message: m.formlogin_submit_success()
		}
	}
}