import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

// Params as the overlay sent them: raw strings, a repeated param as an array, the key (`k`) removed.
export function paramsWithoutKey(params: URLSearchParams): Record<string, string | string[]> {
	const out: Record<string, string | string[]> = {};
	for (const name of new Set(params.keys())) {
		if (name === 'k') continue;
		const values = params.getAll(name);
		out[name] = values.length === 1 ? values[0] : values;
	}
	return out;
}

const BODY_LIMIT = 2048;

function rigDebugEnabled(): boolean {
	const value = env.RIG_DEBUG?.trim().toLowerCase();
	return value === '1' || value === 'true';
}

// One JSON line per /rig/ request when RIG_DEBUG is 1 or true. A handle rather than a
// wrapper in each route, so it also sees 404s and 500s and times the whole request.
// Never logs the URL or the key.
export const rigDebugHandle: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/rig/') || !rigDebugEnabled()) return resolve(event);

	const started = performance.now();
	const response = await resolve(event);

	try {
		// Parsed when it fits, so the line stays readable; otherwise the first ~2 KB as text
		let body: unknown;
		if (response.headers.get('content-type')?.includes('application/json')) {
			const text = await response.clone().text();
			body = text.length > BODY_LIMIT ? `${text.slice(0, BODY_LIMIT)}…` : JSON.parse(text);
		}
		console.log(
			JSON.stringify({
				rigDebug: true,
				ts: new Date().toISOString(),
				method: event.request.method,
				route: event.route.id,
				rigId: event.params.slug ?? null,
				params: paramsWithoutKey(event.url.searchParams),
				status: response.status,
				durationMs: Math.round(performance.now() - started),
				body
			})
		);
	} catch (error) {
		console.error('Rig debug log failed:', error instanceof Error ? error.message : error);
	}

	return response;
};
