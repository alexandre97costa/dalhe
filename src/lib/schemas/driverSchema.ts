import { z } from 'zod/v4';

// Same limits as the avatars bucket (avatars_bucket_policies migration). The browser
// shrinks the picture to a small webp before upload; png and jpeg are for no-JS uploads.
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const driverSchema = z.object({
	// Optional: saving a new name or bio doesn't need a new picture.
	avatar: z
		.file()
		.mime([...AVATAR_MIME_TYPES])
		.max(AVATAR_MAX_BYTES)
		.optional(),
	username: z.string().trim().min(1).max(50),
	bio: z.string().trim().max(100)
});

export type DriverSchema = typeof driverSchema;
