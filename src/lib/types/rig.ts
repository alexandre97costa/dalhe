import * as z from "zod"; 

const rainIntensities = z.literal([
    'ACC_NO_RAIN',
    'ACC_NO_RAIN',
    'ACC_NO_RAIN',
]);

// os campos têm o nome que está no Simhub, o comentário ao lado é um exemplo válido
export const zSessionStats = z.object({
    CurrentGame: z.literal('AssettoCorsaCompetizione'),
    TrackId: z.string(),                        // brands_hatch
    SessionTypeName: z.literal([
        'PRACTICE',
        'HOTLAP',
        8, // SUPERPOLE
        7, // HOTSTINT
        'RACE',
    ]),
    CarId: z.string(),                          // audi_r8_lms_evo
    CarClass: z.string().nullable(),            // GT3 
    TCLevel: z.int().positive(),                // 6
    ABSLevel: z.int().positive(),               // 5
    BrakeBias: z.int(),                         // -17
    AirTemperature: z.int(),                    // 30
    TrackTemperature: z.int(),                  // 37
    rainIntesity: rainIntensities,              // ACC_NO_RAIN
    rainIntensityIn10min: rainIntensities,
    rainIntensityIn30min: rainIntensities,
})
export type SessionStats = z.infer<typeof zSessionStats>;


export type LapStats = {
    lapNumber: number;
    lapTotalCount?: number;
    laptime_ms: number;
    deltaBest: number;
    progress: number; /* Progress from 0 to 1. */
    valid: boolean;
    currentSector: number;
    currentSplit: number;
    s1_ms?: number;
    s2_ms?: number;
    bestS1_ms?: number;
    bestS2_ms?: number;
    bestS3_ms?: number;
}

// Como vem no simhub
export const zNewLap = z.object({
    laptime_ms: z.coerce.number<number>().int().positive(), /* iLastTime */
    s1_time: z.iso.time(), /* format HH:MM[:SS[.s+]] */
    s2_time: z.iso.time(), /* simhub 00:01:10.8620000 */
    s3_time: z.iso.time(),
    carId: z.string().nonempty(), /* Ex. mclaren_720s. Não confundir com o id da db */ 
    trackId: z.string().nonempty() /* Ex. brands_hatch. Não confundir com o id da db */ 
});
export type NewLap = z.infer<typeof zNewLap>;

// Traduzido para supabase
export const zNewLapConverted = z.object({
    rigId: z.uuid({ version: "v4"}),
    laptime_ms: z.coerce.number<number>().int().positive(),
    s1_ms: z.coerce.number<number>().int().positive(),
    s2_ms: z.coerce.number<number>().int().positive(),
    s3_ms: z.coerce.number<number>().int().positive(),
    carId: z.coerce.number<number>().int().positive(),
    trackId: z.coerce.number<number>().int().positive(),
});
export type NewLapConverted = z.infer<typeof zNewLapConverted>;