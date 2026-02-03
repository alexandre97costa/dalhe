import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { createServerClient } from '@supabase/ssr'
import type { Database } from '$lib/types/supabase.types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public'

export const handle: Handle = async ({ event, resolve }) => {

	event.locals.supabase = createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' })
				})
			},
		},
	})

	event.locals.safeGetSession = async () => {
		const {
			data: { user },
			error,
		} = await event.locals.supabase.auth.getUser()
		if (error) {
			return { session: null, user: null }
		}
		const {
			data: { session },
		} = await event.locals.supabase.auth.getSession()
		return { session, user }
	}

	const { session } = await event.locals.safeGetSession();

	if (event.url.pathname !== "/" && !event.url.pathname.startsWith("/login") && !session) {
		console.log(event.url.pathname + ': user not logged in, redirecting to login');
		const redirectUrl = new URL('/login', event.url.origin);
        redirectUrl.searchParams.set('redirectTo', event.url.pathname + event.url.search);
		return Response.redirect(redirectUrl, 303);
	}

	return paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
			filterSerializedResponseHeaders(name: string) {
				return name === 'content-range' || name === 'x-supabase-api-version'
			},
		});
	});
}