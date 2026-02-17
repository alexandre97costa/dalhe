import type { Database, Tables, Enums } from './supabase.types'

// example of how to use the types
// https://supabase.com/docs/reference/javascript/typescript-support
let laptime: Tables<'lap_time'>

export interface RecentLaptime {
    id: Tables<'lap_time'>['id']
    laptime: `${Tables<'lap_time'>['minutes']}:${Tables<'lap_time'>['seconds']}.${Tables<'lap_time'>['sub_seconds']}`
    track: Tables<'race_track'>['name']
    car_make: Tables<'car_make'>['name']
    car_model: Tables<'car'>['model']
    driver: Tables<'profiles'>['username']
}