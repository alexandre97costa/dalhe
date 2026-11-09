import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDriverById, getDriverTimeline, getDriverStats } from '$lib/queries/driver';
import { isUsernameTaken, updateProfile, uploadAvatar } from '$lib/queries/profile';
import { message, setError, superValidate, withFiles } from 'sveltekit-superforms';
import { m } from '$lib/paraglide/messages.js';
import { driverSchema } from '$lib/schemas/driverSchema';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { supabase, safeGetSession } = locals;
	const session = await safeGetSession();

	const driverRecentLaptimes = await getDriverTimeline(supabase, params.slug);
	const driver = await getDriverById(supabase, params.slug);
	const stats = await getDriverStats(supabase, params.slug);

	// The edit form starts from the current values (only the owner sees it).
	const driverForm = await superValidate(
		{ username: driver?.username ?? '', bio: driver?.bio ?? '' },
		zod4(driverSchema),
		{ errors: false }
	);

	return {
		driverForm,
		slug: params.slug,
		laptimes: driverRecentLaptimes,
		driver,
		session,
		stats
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) error(401);
		// Only your own profile. RLS refuses it too; this gives a clear answer instead of a silent no-op.
		if (user.id !== params.slug) error(403);

		const form = await superValidate(request, zod4(driverSchema));
		if (!form.valid) return fail(400, withFiles({ form }));

		// Checked before the upload, so a taken name doesn't leave a new picture behind.
		if (await isUsernameTaken(supabase, form.data.username, user.id)) {
			return setError(form, 'username', m.formdriver_username_error_taken());
		}

		let avatarUrl: string | undefined;
		if (form.data.avatar && form.data.avatar.size > 0) {
			try {
				avatarUrl = await uploadAvatar(supabase, user.id, form.data.avatar);
			} catch (e) {
				console.error('Avatar upload error:', e instanceof Error ? e.message : e);
				return setError(form, 'avatar', m.formdriver_avatar_error_upload());
			}
		}

		const { error: updateError } = await updateProfile(supabase, user.id, {
			username: form.data.username,
			bio: form.data.bio,
			...(avatarUrl && { avatar_url: avatarUrl })
		});

		if (updateError) {
			// profiles_username_key / profiles_username_lower_key: taken between the check and the save
			if (updateError.code === '23505') {
				return setError(form, 'username', m.formdriver_username_error_taken());
			}
			console.error('Profile update error:', updateError.message);
			return message(form, 'error', { status: 500 });
		}

		return message(form, 'success');
	}
};
