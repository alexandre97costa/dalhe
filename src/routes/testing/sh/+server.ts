import { json } from '@sveltejs/kit';

export async function GET({ url }): Promise<Response> {
	const params = Object.fromEntries(url.searchParams.entries());
	const timestamp = new Date().toISOString();

	console.log(`[${timestamp}] GET request received with params:`, params);

	return json({
		args: params
	});
}

export async function POST({ request, url }): Promise<Response> {
	const params = Object.fromEntries(url.searchParams.entries());
	const body = await request.json().catch(() => ({}));
	const timestamp = new Date().toISOString();

	console.log(`[${timestamp}] POST request received with params:`, params, 'and body:', body);

	return json({
		args: params,
		body
	});
}

