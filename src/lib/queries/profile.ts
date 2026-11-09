import type { TypedSupabaseClient } from '$lib/types/supabase';

// One file per user, `avatars/<user id>/avatar`, replaced on every upload. Storage policies
// only allow a user to write inside their own folder.
export async function uploadAvatar(
	supabaseClient: TypedSupabaseClient,
	userId: string,
	file: File
): Promise<string> {
	const path = `${userId}/avatar`;
	const bucket = supabaseClient.storage.from('avatars');

	const { error } = await bucket.upload(path, file, {
		upsert: true,
		contentType: file.type
	});
	if (error) throw error;

	// The path never changes, so a version in the URL makes browsers and the CDN fetch the new one.
	const { data } = bucket.getPublicUrl(path);
	return `${data.publicUrl}?v=${Date.now()}`;
}

// Is the name used by someone else, ignoring case? Mirrors profiles_username_lower_key, so the
// form can say "taken" before uploading anything; the index still decides on a race.
export async function isUsernameTaken(
	supabaseClient: TypedSupabaseClient,
	username: string,
	userId: string
): Promise<boolean> {
	// ilike without wildcards is a case-insensitive equals; escape the user's % _ and \
	const pattern = username.replace(/[\\%_]/g, (c) => `\\${c}`);
	const { count, error } = await supabaseClient
		.from('profiles')
		.select('id', { count: 'exact', head: true })
		.ilike('username', pattern)
		.neq('id', userId);
	if (error) throw error;
	return (count ?? 0) > 0;
}

export type ProfileUpdate = {
	username: string;
	bio: string;
	avatar_url?: string;
};

export async function updateProfile(
	supabaseClient: TypedSupabaseClient,
	userId: string,
	update: ProfileUpdate
) {
	const { error } = await supabaseClient
		.from('profiles')
		.update({ ...update, bio: update.bio || null, updated_at: new Date().toISOString() })
		.eq('id', userId);
	return { error };
}
