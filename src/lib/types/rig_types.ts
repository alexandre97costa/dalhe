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
    
}