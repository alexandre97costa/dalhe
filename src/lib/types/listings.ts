import type { Database, Tables, Enums } from './supabase.types'

// example of how to use the types
// https://supabase.com/docs/reference/javascript/typescript-support
let laptime: Tables<'lap_time'>

export interface RecentLaptime {
    id: Tables<'lap_time'>['id']
    laptime_ms: Tables<'lap_time'>['time_milliseconds']
    laptime_parsed: Tables<'lap_time'>['time_parsed']
    created_at: Tables<'lap_time'>['created_at']
    track_id: Tables<'race_track'>['id']
    track: Tables<'race_track'>['name']
    car_id: Tables<'car'>['id']
    car_model: Tables<'car'>['model']
    car_make: Tables<'car_make'>['name']
    driver_id: Tables<'profiles'>['id']
    driver: Tables<'profiles'>['username']
    driver_avatar: Tables<'profiles'>['avatar_url']
}