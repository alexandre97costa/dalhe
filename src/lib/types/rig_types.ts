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
    lapProgress: number; /* Progress from 0 to 1. */
    lapValid: boolean;
    currentSector: number;
    currentSplit: number;
    currentLapTime: number;
    deltaLapTime: number;
    sector1Time?: number;
    sector2Time?: number;
}

export type NewLap = {
    
}