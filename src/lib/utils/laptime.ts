import { m } from '$lib/paraglide/messages.js';

export function formatLaptime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function formatTimeSinceCreation(createdAt: string | Date): string {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return m.laptime_createdat_now();
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return m.laptime_createdat_minutes({ minutes: diffMins });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return m.laptime_createdat_hours({ hours: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return m.laptime_createdat_days({ days: diffDays });
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return m.laptime_createdat_months({ months: diffMonths });
    const diffYears = Math.floor(diffMonths / 12);
    return m.laptime_createdat_years({ years: diffYears });
}

export function compareLaptimes(laptime: number, bestLap: number): { diff: string; isFaster: boolean } {
    const difference = bestLap - laptime;
    const isFaster = difference > 0;
    const absDiff = Math.abs(difference);
    const diffSeconds = (absDiff / 1000).toFixed(3);
    
    return {
        diff: `${isFaster ? '-' : '+'}${diffSeconds}s`,
        isFaster
    };
}