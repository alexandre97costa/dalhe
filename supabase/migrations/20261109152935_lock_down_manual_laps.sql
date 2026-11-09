-- Laps come only from rigs (insert_lap, called by the rig endpoints with the service role).
-- Manual lap entry was removed from the app; this closes the database path it used, so a
-- signed-in user can no longer insert laps directly with the public key.

drop policy "Enable insert for users based on user_id" on public.lap_time;

revoke insert, update, delete on public.lap_time from anon, authenticated;
