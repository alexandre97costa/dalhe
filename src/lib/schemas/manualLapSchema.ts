import { z } from 'zod/v4';
import { m } from '$lib/paraglide/messages.js';
import { digitsToMilliseconds, lastSectorMilliseconds } from '$lib/utils/laptime';

// Select values are strings; the server turns them into numbers.
const id = () => z.string().regex(/^[1-9]\d*$/, { error: () => m.manuallap_error_required() });

// Times are typed as 7 digits, MMSSmmm (shown as MM:SS.mmm).
const time = z
	.string()
	.refine((v) => (digitsToMilliseconds(v) ?? 0) > 0, { error: () => m.manuallap_error_time() });
const optionalTime = z.union([z.literal(''), time]);

// Sectors are optional: S1 and S2 both or neither, and S3 (computed) must stay above zero.
// insert_manual_lap checks the same rules.
export const manualLapSchema = z
	.object({
		game_id: id(),
		track_id: id(),
		// Only filters the models; not stored.
		make_id: id(),
		car_id: id(),
		laptime: time,
		s1: optionalTime.default(''),
		s2: optionalTime.default('')
	})
	.superRefine((lap, ctx) => {
		if (!lap.s1 && !lap.s2) return;
		if (!lap.s1 || !lap.s2) {
			ctx.addIssue({
				code: 'custom',
				path: [lap.s1 ? 's2' : 's1'],
				message: m.manuallap_error_sectors_both()
			});
			return;
		}
		const s3 = lastSectorMilliseconds(
			digitsToMilliseconds(lap.laptime),
			digitsToMilliseconds(lap.s1),
			digitsToMilliseconds(lap.s2)
		);
		if (s3 !== null && s3 <= 0) {
			ctx.addIssue({ code: 'custom', path: ['s2'], message: m.manuallap_error_sectors_sum() });
		}
	});

export type ManualLapSchema = typeof manualLapSchema;
