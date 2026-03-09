import type { Database, Tables, Enums } from './supabase.types'

// example of how to use the types
// https://supabase.com/docs/reference/javascript/typescript-support
let laptime: Tables<'lap_time'>

export interface RecentLaptime {
    created_at: Tables<'listing_recent_laptimes'>['created_at']
    driver: Tables<'listing_recent_laptimes'>['driver']
    car_make: Tables<'listing_recent_laptimes'>['car_make']
    car_model: Tables<'listing_recent_laptimes'>['car_model']
    track_name: Tables<'listing_recent_laptimes'>['track_name']
    laptime: Tables<'listing_recent_laptimes'>['laptime']
    previous_laptime: Tables<'listing_recent_laptimes'>['previous_laptime'] | null
    is_personal_best: Tables<'listing_recent_laptimes'>['is_personal_best']
    is_track_record: Tables<'listing_recent_laptimes'>['is_track_record']
}
export interface LeaderboardEntry {
    rank: number,
    created_at: Tables<'lap_time'>['created_at'],
    driver: Tables<'profiles'>['username'],
    car_make: Tables<'car_make'>['name'],
    car_model: Tables<'car'>['model'],
    laptime: Tables<'lap_time'>['time_milliseconds'],
    track_record: Tables<'lap_time'>['time_milliseconds'],
}