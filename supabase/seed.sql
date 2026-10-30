-- Local seed data, loaded by `supabase db reset` (and `pnpm db:reset`).
--
-- Catalog tables (game, car_category, car_make, car, race_track, reference_time)
-- are copied from the hosted database as of 2026-10-27, ids included.
-- Everything else is synthetic: no real people, emails or rigs. The repo is
-- public, so keep it that way.

-- ---------------------------------------------------------------------------
-- Catalog (copied from hosted)
-- ---------------------------------------------------------------------------

insert into public.game (id, created_at, name) values
  (1, '2026-04-10 13:49:58.22704+00', 'Assetto Corsa Competizione');

insert into public.car_category (id, created_at, name) values
  (1, '2025-04-21 19:22:48.516275+00', 'GT3'),
  (2, '2025-04-21 19:22:56.779484+00', 'GT2'),
  (3, '2025-04-21 19:23:03.457941+00', 'GT4'),
  (4, '2026-04-09 21:54:18.076709+00', 'F1');

insert into public.car_make (id, created_at, name) values
  (1, '2025-04-21 19:25:31.805769+00', 'Alpine'),
  (2, '2025-04-21 19:25:41.750697+00', 'Aston Martin'),
  (3, '2025-04-21 19:25:47.97951+00', 'Audi'),
  (4, '2025-04-21 19:25:56.316825+00', 'Bentley'),
  (5, '2025-04-21 19:26:12.446067+00', 'BMW'),
  (6, '2025-04-21 19:26:20.267228+00', 'Chevrolet'),
  (7, '2025-04-21 19:26:27.652163+00', 'Emil Frey'),
  (8, '2025-04-21 19:26:37.220273+00', 'Ferrari'),
  (9, '2025-04-21 19:26:48.726256+00', 'Honda'),
  (10, '2025-04-21 19:26:57.178896+00', 'Lamborghini'),
  (11, '2025-04-21 19:27:04.193781+00', 'Lexus'),
  (12, '2025-04-21 19:27:10.162752+00', 'Maserati'),
  (13, '2025-04-21 19:27:16.673598+00', 'McLaren'),
  (14, '2025-04-21 19:27:23.602578+00', 'Mercedes'),
  (15, '2025-04-21 19:27:29.862495+00', 'Nissan'),
  (16, '2025-04-21 19:27:35.851081+00', 'Porsche'),
  (17, '2025-04-21 19:27:44.912375+00', 'Reiter Engineering'),
  (18, '2026-09-26 18:18:44.916631+00', 'Ford');

insert into public.car (id, created_at, make_id, model, year, category_id, simhub_carid) values
  (1, '2025-04-21 19:28:58.919968+00', 2, 'V12 Vantage', 2013, 1, null),
  (2, '2025-04-21 19:31:46.626927+00', 2, 'V8 Vantage', 2019, 1, 'amr_v8_vantage_gt3'),
  (3, '2025-06-26 20:13:36.922236+00', 3, 'R8 LMS', 2015, 1, null),
  (4, '2025-06-26 20:13:36.922236+00', 3, 'R8 LMS Evo', 2019, 1, 'audi_r8_lms_evo'),
  (5, '2025-06-26 20:13:36.922236+00', 3, 'R8 LMS Evo II', 2022, 1, null),
  (6, '2025-06-26 20:13:36.922236+00', 4, 'Continental', 2015, 1, null),
  (7, '2025-06-26 20:13:36.922236+00', 4, 'Continental', 2018, 1, 'bentley_continental_gt3_2018'),
  (8, '2025-06-26 20:13:36.922236+00', 5, 'M6', 2017, 1, 'bmw_m6_gt3'),
  (9, '2025-06-26 20:13:36.922236+00', 5, 'M4', 2021, 1, null),
  (10, '2025-06-26 20:13:36.922236+00', 7, 'Jaguar', 2012, 1, null),
  (11, '2025-06-26 20:13:36.922236+00', 8, '488', 2018, 1, 'ferrari_488_gt3'),
  (12, '2025-06-26 20:13:36.922236+00', 8, '488 EVO', 2020, 1, null),
  (13, '2025-06-26 20:13:36.922236+00', 8, '296', 2023, 1, null),
  (14, '2025-06-26 20:13:36.922236+00', 9, 'NSX', 2017, 1, null),
  (15, '2025-06-26 20:13:36.922236+00', 9, 'NSX Evo', 2019, 1, 'honda_nsx_gt3_evo'),
  (16, '2025-06-26 20:13:36.922236+00', 10, 'Huracan', 2015, 1, 'lamborghini_huracan_gt3'),
  (17, '2025-06-26 20:13:36.922236+00', 10, 'Huracan Evo', 2019, 1, 'lamborghini_huracan_gt3_evo'),
  (18, '2025-06-26 20:13:36.922236+00', 10, 'Huracan Evo2', 2023, 1, null),
  (19, '2025-06-26 20:13:36.922236+00', 11, 'RC F', 2016, 1, 'lexus_rc_f_gt3'),
  (20, '2025-06-26 20:13:36.922236+00', 13, '650S', 2015, 1, null),
  (21, '2025-06-26 20:13:36.922236+00', 13, '720S', 2019, 1, null),
  (22, '2025-06-26 20:13:36.922236+00', 13, '720S Evo', 2015, 1, 'mclaren_720s_gt3_evo'),
  (23, '2025-06-26 20:13:36.922236+00', 14, 'AMG', 2015, 1, 'mercedes_amg_gt3'),
  (24, '2025-06-26 20:13:36.922236+00', 14, 'AMG Evo', 2020, 1, null),
  (25, '2025-06-26 20:13:36.922236+00', 15, 'GTR Nismo', 2015, 1, null),
  (26, '2025-06-26 20:13:36.922236+00', 15, 'GTR Nismo', 2018, 1, null),
  (27, '2025-06-26 20:13:36.922236+00', 16, '911', 2018, 1, null),
  (28, '2025-06-26 20:13:36.922236+00', 16, '911 II', 2019, 1, 'porsche_991ii_gt3_r'),
  (29, '2025-06-26 20:13:36.922236+00', 16, '992', 2023, 1, null),
  (30, '2025-06-26 20:13:36.922236+00', 17, 'R-EX', 2017, 1, null),
  (31, '2026-09-26 18:19:52.613408+00', 18, 'Mustang', 2024, 1, null);

insert into public.race_track (id, created_at, name, location, length, country_code, simhub_trackid) values
  (1, '2025-04-21 19:34:01.646854+00', 'Silverstone', 'United Kingdom', 5891, 'GB', 'Silverstone'),
  (2, '2025-06-26 19:57:39.605999+00', 'Barcelona', 'Spain', 4655, 'ES', 'Barcelona'),
  (3, '2025-06-26 19:57:39.605999+00', 'Brands Hatch', 'United Kingdom', 3908, 'GB', 'brands_hatch'),
  (4, '2025-06-26 19:57:39.605999+00', 'Hungaroring', 'Hungary', 4381, 'HU', 'Hungaroring'),
  (5, '2025-06-26 19:57:39.605999+00', 'Misano', 'Italy', 4226, 'IT', 'misano'),
  (6, '2025-06-26 19:57:39.605999+00', 'Monza', 'Italy', 5793, 'IT', 'monza'),
  (7, '2025-06-26 19:57:39.605999+00', 'Nürburgring', 'Germany', 5137, 'DE', 'nurburgring'),
  (8, '2025-06-26 19:57:39.605999+00', 'Paul Ricard', 'France', 5842, 'FR', 'Paul_Ricard'),
  (9, '2025-06-26 19:57:39.605999+00', 'Spa-Francorchamps', 'Belgium', 7004, 'BE', 'Spa'),
  (10, '2025-06-26 19:57:39.605999+00', 'Zandvoort', 'Netherlands', 4252, 'NL', 'Zandvoort'),
  (11, '2025-06-26 19:57:39.605999+00', 'Zolder', 'Belgium', 4011, 'BE', 'Zolder'),
  (12, '2025-06-26 19:57:39.605999+00', 'Kyalami', 'South Africa', null, 'ZA', null),
  (13, '2025-06-26 19:57:39.605999+00', 'Suzuka', 'Japan', null, 'JP', null),
  (14, '2025-06-26 19:57:39.605999+00', 'Laguna Seca', 'United States of America', null, 'US', null),
  (15, '2025-06-26 19:57:39.605999+00', 'Mount Panorama', 'Australia', null, 'AU', null),
  (16, '2025-06-26 19:57:39.605999+00', 'Imola', 'Italy', null, 'IT', null),
  (17, '2025-06-26 19:57:39.605999+00', 'Nordschleife', 'Germany', null, 'DE', null),
  (18, '2026-03-12 12:16:07.738471+00', 'Red Bull Ring', 'Austria', 4326, 'AT', null),
  (19, '2026-04-04 10:32:28.615347+00', 'Valencia', 'Spain', 4005, 'ES', null);

insert into public.reference_time (id, created_at, time_ms, track_id, category_id, game_id) values
  (1, '2026-04-20 22:40:19.297046+00', 115842, 1, 1, 1),
  (2, '2026-04-20 22:40:19.297046+00', 102097, 2, 1, 1),
  (3, '2026-04-20 22:40:19.297046+00', 81935, 3, 1, 1),
  (4, '2026-04-20 22:40:19.297046+00', 101790, 4, 1, 1),
  (5, '2026-04-20 22:40:19.297046+00', 91957, 5, 1, 1),
  (6, '2026-04-20 22:40:19.297046+00', 97580, 6, 1, 1),
  (7, '2026-04-20 22:40:19.297046+00', 112112, 7, 1, 1),
  (8, '2026-04-20 22:40:19.297046+00', 109815, 8, 1, 1),
  (9, '2026-04-20 22:40:19.297046+00', 134060, 9, 1, 1),
  (10, '2026-04-20 22:40:19.297046+00', 93905, 10, 1, 1),
  (11, '2026-04-20 22:40:19.297046+00', 86460, 11, 1, 1),
  (12, '2026-04-20 22:40:19.297046+00', 99332, 12, 1, 1),
  (13, '2026-04-20 22:40:19.297046+00', 117225, 13, 1, 1),
  (14, '2026-04-20 22:40:19.297046+00', 80965, 14, 1, 1),
  (15, '2026-04-20 22:40:19.297046+00', 118682, 15, 1, 1),
  (16, '2026-04-20 22:40:19.297046+00', 97402, 16, 1, 1),
  (17, '2026-04-20 22:40:19.297046+00', 479522, 17, 1, 1),
  (18, '2026-04-20 22:40:19.297046+00', 86695, 18, 1, 1),
  (19, '2026-04-20 22:40:19.297046+00', 89465, 19, 1, 1);

-- ---------------------------------------------------------------------------
-- Synthetic users. Log in with a magic link: enter the email on /login, then
-- open the link from the local inbox (Mailpit, http://127.0.0.1:54324).
-- The on_auth_user_created trigger creates each profile (username = the part
-- of the email before the @, full_name from raw_user_meta_data).
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, '',
  now() - interval '60 days',
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', u.full_name),
  now() - interval '60 days', now() - interval '60 days',
  '', '', '', '', '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'alice@example.com', 'Alice Andrade'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'bruno@example.com', 'Bruno Barros'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'carla@example.com', 'Carla Correia'),
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'diogo@example.com', 'Diogo Dias')
) as u (id, email, full_name);

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now() - interval '60 days', now() - interval '60 days', now() - interval '60 days'
from auth.users u
where u.email like '%@example.com';

-- ---------------------------------------------------------------------------
-- Synthetic rigs and sessions
-- ---------------------------------------------------------------------------

insert into public.rig (id, name) values
  ('b0000000-0000-4000-8000-000000000001', 'Sala'),
  ('b0000000-0000-4000-8000-000000000002', 'Garagem');

-- Known keys, so the fake rig can call the local endpoints (?k=). Local only.
insert into public.rig_key (rig_id, api_key) values
  ('b0000000-0000-4000-8000-000000000001', 'local-sala-key'),
  ('b0000000-0000-4000-8000-000000000002', 'local-garagem-key');

insert into public.rig_drivers (rig_id, driver_id) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004');

-- Six finished sessions per driver, one a week, ending in the current week.
-- Drivers 1-2 race on "Sala", drivers 3-4 on "Garagem".
create temporary table seed_session as
select
  md5(format('session-%s-%s', d, k))::uuid as id,
  case when d <= 2 then 'b0000000-0000-4000-8000-000000000001'::uuid
       else 'b0000000-0000-4000-8000-000000000002'::uuid end as rig_id,
  format('a0000000-0000-4000-8000-%s', lpad(d::text, 12, '0'))::uuid as driver_id,
  date_trunc('day', now()) - make_interval(days => (6 - k) * 7 + d) + interval '21 hours' as started_at,
  d, k
from generate_series(1, 4) d, generate_series(1, 6) k;

insert into public.rig_session (id, rig_id, driver_id, started_at, ended_at, last_activity_at, created_at)
select id, rig_id, driver_id, started_at, started_at + interval '1 hour', started_at + interval '1 hour', started_at
from seed_session;

-- One active session, so a rig shows a connected driver.
insert into public.rig_session (id, rig_id, driver_id, started_at, last_activity_at)
values (
  md5('session-active')::uuid, 'b0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000003', now() - interval '20 minutes', now()
);

-- ---------------------------------------------------------------------------
-- Synthetic laps: five per session on a few popular tracks, a bit slower than
-- the reference time and improving week by week. Inserted in time order so the
-- lap_time triggers set podiums and pole ratings as if driven live.
-- The last lap of each driver's latest session is a test lap (for_testing).
-- ---------------------------------------------------------------------------

insert into public.lap_time (
  created_at, driver_id, track_id, car_id, game_id, rig_id, session_id,
  time_milliseconds, sector1_ms, sector2_ms, sector3_ms, for_testing
)
select
  l.created_at, l.driver_id, l.track_id, l.car_id, 1, l.rig_id, l.session_id,
  l.ms, round(l.ms * 0.31), round(l.ms * 0.36), l.ms - round(l.ms * 0.31) - round(l.ms * 0.36),
  l.k = 6 and l.i = 5
from (
  select
    s.started_at + make_interval(mins => i * 4) as created_at,
    s.driver_id, s.rig_id, s.id as session_id, s.k, i,
    t.track_id,
    (array[16, 23, 28, 11])[s.d] + case when s.k % 2 = 0 then 0 else 1 end as car_id,
    -- Pace by driver and week, plus up to ~1s of fixed per-lap jitter.
    round(r.time_ms * (1.015 + s.d * 0.004 - s.k * 0.002))::int
      + (s.d * 7919 + s.k * 6271 + i * 3571) % 997 as ms
  from seed_session s
  cross join generate_series(1, 5) i
  cross join lateral (select (array[1, 6, 9, 3, 7, 2])[((s.k + s.d) % 6) + 1] as track_id) t
  join public.reference_time r on r.track_id = t.track_id and r.category_id = 1 and r.game_id = 1
) l
order by l.created_at
on conflict do nothing;

drop table seed_session;

-- ---------------------------------------------------------------------------
-- Synthetic tournament
-- ---------------------------------------------------------------------------

insert into public.tournament (id, name, description, status, scoring_type, start_date, end_date) values
  (1, 'Taça de Outono', 'Synthetic tournament for local development.', 'Ongoing', 'Aggregate',
   date_trunc('day', now()) - interval '14 days', date_trunc('day', now()) + interval '14 days');

insert into public.tournament_participant (tournament_id, driver_id, is_admin) values
  (1, 'a0000000-0000-4000-8000-000000000001', true),
  (1, 'a0000000-0000-4000-8000-000000000002', false),
  (1, 'a0000000-0000-4000-8000-000000000003', false),
  (1, 'a0000000-0000-4000-8000-000000000004', false);

insert into public.tournament_track (tournament_id, track_id, order_index) values
  (1, 1, 1),
  (1, 6, 2),
  (1, 9, 3);

-- ---------------------------------------------------------------------------
-- Rows above use explicit ids; move each identity past them so new rows don't
-- collide.
-- ---------------------------------------------------------------------------

select setval(pg_get_serial_sequence('public.game', 'id'), (select max(id) from public.game));
select setval(pg_get_serial_sequence('public.car_category', 'id'), (select max(id) from public.car_category));
select setval(pg_get_serial_sequence('public.car_make', 'id'), (select max(id) from public.car_make));
select setval(pg_get_serial_sequence('public.car', 'id'), (select max(id) from public.car));
select setval(pg_get_serial_sequence('public.race_track', 'id'), (select max(id) from public.race_track));
select setval(pg_get_serial_sequence('public.reference_time', 'id'), (select max(id) from public.reference_time));
select setval(pg_get_serial_sequence('public.tournament', 'id'), (select max(id) from public.tournament));
