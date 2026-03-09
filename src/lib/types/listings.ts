import type { Database, Tables, Enums } from './supabase.types'

// example of how to use the types
// https://supabase.com/docs/reference/javascript/typescript-support
let laptime: Tables<'lap_time'>

export interface RecentLaptime {
    created_at: Tables<'listing_recent_laptimes'>['created_at']
    driver: Tables<'listing_recent_laptimes'>['driver']
    driver_avatar: Tables<'listing_recent_laptimes'>['driver_avatar']
    car_make: Tables<'listing_recent_laptimes'>['car_make']
    car_model: Tables<'listing_recent_laptimes'>['car_model']
    track_name: Tables<'listing_recent_laptimes'>['track_name']
    laptime: Tables<'listing_recent_laptimes'>['laptime']
    previous_laptime: Tables<'listing_recent_laptimes'>['previous_laptime'] | null
    is_personal_best: Tables<'listing_recent_laptimes'>['is_personal_best']
    is_track_record: Tables<'listing_recent_laptimes'>['is_track_record']
}

export interface LeaderboardEntry {
    // driver: Tables<'leaderboard'>['driver']
    // driver_avatar: Tables<'leaderboard'>['driver_avatar']
    // car_make: Tables<'leaderboard'>['car_make']
    // car_model: Tables<'leaderboard'>['car_model']
    // track_name: Tables<'leaderboard'>['track_name']
    // laptime: Tables<'leaderboard'>['laptime']
    // rank: Tables<'leaderboard'>['rank']
}