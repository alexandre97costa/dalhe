import type { Database, Tables, Enums } from './supabase.types'

// example of how to use the types
// https://supabase.com/docs/reference/javascript/typescript-support
let laptime: Tables<'lap_time'>

export interface RecentLaptime {
    id: Tables<'lap_time'>['id']
    laptime: `${Tables<'lap_time'>['minutes']}:${Tables<'lap_time'>['seconds']}.${Tables<'lap_time'>['sub_seconds']}`
    track_id: Tables<'lap_time'>['track_id']
    track: Tables<'race_track'>['name']
    car_id: Tables<'lap_time'>['car_id']
    car_make: Tables<'car_make'>['name']
    car_model: Tables<'car'>['model']
    driver_id: Tables<'lap_time'>['driver_id']
    driver: Tables<'profiles'>['username']
    driver_avatar: Tables<'profiles'>['avatar_url']
}