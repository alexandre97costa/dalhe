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

export type NewLap = {
    laptime_ms: number; /* iLastTime */
    s1_time: string;
    s2_time: string;
    s3_time: string;
    carName: string;
    trackName: string;  
    rigId?: string;
}

export const NewLapSchema = z.object({
    laptime_ms: z.coerce.number<number>().int().positive(),
    s1_time: z.iso.time(), /* format HH:MM[:SS[.s+]] */
    s2_time: z.iso.time(), /* simhub 00:01:10.8620000 */
    s3_time: z.iso.time(),
    carName: z.string().nonempty(),
    trackName: z.string().nonempty(),
    rigId: z.optional(z.uuid({version: 'v4'}))
});