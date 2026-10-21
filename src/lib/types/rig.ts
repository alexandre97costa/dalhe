import * as z from "zod"; 

export type SessionStats = {
    gameName: string;
    trackName: string;
    sessionType: string;
    carName: string;
    carClass: string;
    tractionControl?: number;
    brakeBias?: number;
    abs?: number;
    airTemperature?: number;
    trackTemperature?: number;
    rainDensity?: number;
};


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