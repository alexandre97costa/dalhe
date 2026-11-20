import * as z from 'zod';

// The overlay sends everything as query params (strings): numbers are coerced, booleans are "true"/"false".
const int = z.coerce.number<number>().int();
const num = z.coerce.number<number>();
export const zRainIntensity = z.union([
	z.coerce.number().int(),
	z.enum([
		'ACC_NO_RAIN',
		'ACC_DRIZZLE',
		'ACC_LIGHT_RAIN', // Doesnt seem to exist but its ok to leave it here for future proofing
		'ACC_MEDIUM_RAIN',
		'ACC_HEAVY_RAIN',
		'ACC_THUNDERSTORM'
	])
])

	;
export type RainIntensity = z.infer<typeof zRainIntensity>;

// Sim session stats, /send/session. Stored in rig_stats.session_stats.
// os campos têm o nome que está no Simhub, o comentário ao lado é um exemplo válido
export const zSessionStats = z.object({
	CurrentGame: z.literal('AssettoCorsaCompetizione'),
	TrackId: z.string().nonempty(), // brands_hatch
	SessionTypeName: z.union([
		z.enum(['PRACTICE', 'HOTLAP', 'RACE']),
		num.pipe(
			z.literal([
				8, // SUPERPOLE
				7 // HOTSTINT
			])
		)
	]),
	CarId: z.string().nonempty(), // audi_r8_lms_evo
	CarClass: z.string().nullish(), // GT3
	TCLevel: z.coerce.number().int().nonnegative(), // 6 (0 = off)
	ABSLevel: z.coerce.number().int().nonnegative(), // 5 (0 = off)
	BrakeBias: z.coerce.number().int(), // -17
	AirTemperature: z.coerce.number(), // 30
	TrackTemperature: z.coerce.number(), // 37
	rainIntensity: zRainIntensity, // ACC_NO_RAIN (renamed from the typo rainIntesity in Sprint 1.5)
	rainIntensityIn10min: zRainIntensity,
	rainIntensityIn30min: zRainIntensity
});
export type SessionStats = z.infer<typeof zSessionStats>;

// Live lap stats, /send/live. Stored in rig_stats.lap_stats.
export const zLapStats = z.object({
	lapNumber: z.coerce.number().int().nonnegative(),
	lapTotalCount: z.coerce.number().int().nonnegative().optional(),
	laptime_ms: z.coerce.number().int().nonnegative(),
	deltaBest: z.coerce.number(),
	progress: z.coerce.number().min(0).max(1) /* Progress from 0 to 1. */,
	valid: z.stringbool(),
	currentSector: z.coerce.number().int().min(1).max(3),
	currentSplit: z.coerce.number().int().nonnegative(),
	s1_ms: z.preprocess((val: string) => { return (val === "null") ? null : val; }, z.iso.time().nullable()),
	s2_ms: z.preprocess((val: string) => { return (val === "null") ? null : val; }, z.iso.time().nullable()),
	bestS1_ms: z.preprocess((val: string) => { return (val === "null") ? null : val; }, z.iso.time().nullable()),
	bestS2_ms: z.preprocess((val: string) => { return (val === "null") ? null : val; }, z.iso.time().nullable()),
	bestS3_ms: z.preprocess((val: string) => { return (val === "null") ? null : val; }, z.iso.time().nullable())
});
export type LapStats = z.infer<typeof zLapStats>;

// Como vem no simhub
export const zNewLap = z.object({
	laptime_ms: z.coerce.number<number>().int().positive() /* iLastTime */,
	s1_time: z.iso.time() /* format HH:MM[:SS[.s+]] */,
	s2_time: z.iso.time() /* simhub 00:01:10.8620000 */,
	s3_time: z.iso.time(),
	carId: z.string().nonempty() /* Ex. mclaren_720s. Não confundir com o id da db */,
	trackId: z.string().nonempty() /* Ex. brands_hatch. Não confundir com o id da db */
});
export type NewLap = z.infer<typeof zNewLap>;

// Traduzido para supabase
export const zNewLapConverted = z.object({
	rigId: z.uuid({ version: 'v4' }),
	laptime_ms: z.coerce.number<number>().int().positive(),
	s1_ms: z.coerce.number<number>().int().positive(),
	s2_ms: z.coerce.number<number>().int().positive(),
	s3_ms: z.coerce.number<number>().int().positive(),
	carId: z.coerce.number<number>().int().positive(),
	trackId: z.coerce.number<number>().int().positive()
});
export type NewLapConverted = z.infer<typeof zNewLapConverted>;
