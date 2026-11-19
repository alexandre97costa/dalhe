-- Homepage Activity: laps of one session on the same track and car show as one group.
-- The group key needs the car's id (make and model names aren't a safe key), so car_id
-- is appended to listing_recent_laptimes (create or replace only allows appending).

create or replace view public.listing_recent_laptimes with (security_invoker = on) as
 select l.created_at,
    l.game_id,
    driver.id as driverid,
    driver.username as driver,
    car_make.name as car_make,
    car.model as car_model,
    track.id as trackid,
    track.name as track_name,
    l.time_milliseconds as laptime,
    lag(l.time_milliseconds) over (partition by l.driver_id, l.track_id order by l.created_at) as previous_laptime,
    (l.time_milliseconds = min(l.time_milliseconds) over (partition by l.track_id, l.driver_id)) as is_personal_best,
    (l.time_milliseconds = min(l.time_milliseconds) over (partition by l.track_id)) as is_track_record,
    l.id as lap_id,
    l.session_id,
    driver.avatar_url as driver_avatar_url,
    l.car_id
   from public.lap_time l
     join public.profiles driver on driver.id = l.driver_id
     join public.car on car.id = l.car_id
     join public.car_make on car_make.id = car.make_id
     join public.race_track track on track.id = l.track_id
  where l.for_testing = false
  order by l.created_at desc;
