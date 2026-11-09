// Browser only. Crops the picture to a centred square and shrinks it to AVATAR_SIZE px,
// so uploads stay small (a few tens of KB) whatever the phone camera produced.
export const AVATAR_SIZE = 256;

export async function resizeAvatar(file: File, size = AVATAR_SIZE): Promise<File> {
	const bitmap = await createImageBitmap(file);
	const side = Math.min(bitmap.width, bitmap.height);
	const sx = (bitmap.width - side) / 2;
	const sy = (bitmap.height - side) / 2;

	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('No 2d canvas');
	context.imageSmoothingQuality = 'high';
	context.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
	bitmap.close();

	// Browsers that can't encode webp hand back a png, which the bucket also accepts.
	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, 'image/webp', 0.85)
	);
	if (!blob) throw new Error('Could not encode the picture');

	const extension = blob.type === 'image/webp' ? 'webp' : 'png';
	return new File([blob], `avatar.${extension}`, { type: blob.type });
}
