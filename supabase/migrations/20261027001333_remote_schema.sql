


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."TournamentScoring" AS ENUM (
    'Aggregate',
    'Points-Based (Participants)',
    'Points-Based (F1)'
);


ALTER TYPE "public"."TournamentScoring" OWNER TO "postgres";


COMMENT ON TYPE "public"."TournamentScoring" IS 'How is the tournament winner determined?';



CREATE TYPE "public"."TournamentStatus" AS ENUM (
    'Draft',
    'Scheduled',
    'Ongoing',
    'Completed'
);


ALTER TYPE "public"."TournamentStatus" OWNER TO "postgres";


COMMENT ON TYPE "public"."TournamentStatus" IS 'ENUM to help filter out tournaments by past, ongoing, etc.';



CREATE OR REPLACE FUNCTION "public"."connect_to_rig"("p_rig_id" "uuid", "p_driver_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_session_id uuid;
begin
  -- serialize concurrent connects on the same rig
  perform 1 from rig where id = p_rig_id for update;

  -- close whatever is open (guest or another driver)
  update rig_session
  set ended_at = now()
  where rig_id = p_rig_id and ended_at is null;

  -- new session, driver already known
  insert into rig_session (rig_id, driver_id, started_at, last_activity_at)
  values (p_rig_id, p_driver_id, now(), now())
  returning id into v_session_id;

  -- remember this rig for the user (needs unique (rig_id, user_id))
  insert into rig_drivers (rig_id, user_id, last_connected_at)
  values (p_rig_id, p_driver_id, now())
  on conflict (rig_id, user_id)
  do update set last_connected_at = now();

  -- don't show the previous driver's badges to the new one
  delete from rig_stats where rig_id = p_rig_id;

  return v_session_id;
end;
$$;


ALTER FUNCTION "public"."connect_to_rig"("p_rig_id" "uuid", "p_driver_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."disconnect_from_rig"("p_rig_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_session_id uuid;
begin
  -- same lock as connect_to_rig, so the two can't interleave
  perform 1 from rig where id = p_rig_id for update;

  update rig_session
  set ended_at = now()
  where rig_id = p_rig_id and ended_at is null
  returning id into v_session_id;

  delete from rig_stats where rig_id = p_rig_id;

  return v_session_id;  -- NULL if there was nothing to close
end;
$$;


ALTER FUNCTION "public"."disconnect_from_rig"("p_rig_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_driver_timeline"("driverid" "uuid", "testing" boolean) RETURNS TABLE("created_at" timestamp with time zone, "driver" "text", "car_make" "text", "car_model" "text", "trackid" bigint, "track_name" "text", "laptime" integer, "previous_laptime" integer, "track_record" integer, "is_personal_best" boolean, "is_track_record" boolean)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select 
    l.created_at as created_at,
    driver.username as driver,
    car_make.name as car_make,
    car.model as car_model,
    race_track.id as trackid,
    race_track.name as track_name,
    l.time_milliseconds as laptime,
    lag(l.time_milliseconds) over (
      partition by
        l.driver_id,
        l.track_id
      order by
        l.created_at asc
    ) as previous_laptime,
    first_value(l.time_milliseconds) over (
      partition by l.track_id
      order by l.time_milliseconds asc
    ) as track_record,
    l.time_milliseconds = min(l.time_milliseconds) over (
      partition by
        l.track_id,
        l.driver_id
    ) as is_personal_best,
    l.time_milliseconds = min(l.time_milliseconds) over (
      partition by
        l.track_id
    ) as is_track_record
  from lap_time l
  join profiles driver on driver.id = l.driver_id
  join car on car.id = l.car_id
  join car_make on car_make.id = car.make_id
  join race_track on l.track_id = race_track.id
  where l.driver_id = driverid
  and l.for_testing = testing;
end;
$$;


ALTER FUNCTION "public"."get_driver_timeline"("driverid" "uuid", "testing" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leaderboard_by_track"("track" bigint, "category" bigint, "testing" boolean) RETURNS TABLE("rank" bigint, "created_at" timestamp with time zone, "driverid" "uuid", "driver" "text", "car_make" "text", "car_model" "text", "laptime" integer, "track_record" integer)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select 
    rank() over (
      partition by l.track_id
      order by l.time_milliseconds asc
    ) as rank,
    l.created_at as created_at,
    driver.id as driverid,
    driver.username as driver,
    car_make.name as car_make,
    car.model as car_model,
    l.time_milliseconds as laptime,
    first_value(l.time_milliseconds) over (
      partition by l.track_id
      order by l.time_milliseconds asc
    ) as track_record
  from lap_time l
  join profiles driver on driver.id = l.driver_id
  join car on car.id = l.car_id
  join car_make on car_make.id = car.make_id
  where l.track_id = track
  and car.category_id = category
  and l.for_testing = testing;
end;
$$;


ALTER FUNCTION "public"."get_leaderboard_by_track"("track" bigint, "category" bigint, "testing" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_active_session"("p_rig_id" "uuid", "p_timeout_minutes" integer) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_session_id uuid;
begin
  -- 1. close the rig's open session if it's stale
  update rig_session
  set ended_at = last_activity_at
  where rig_id = p_rig_id
    and ended_at is null
    and last_activity_at < now() - make_interval(mins => p_timeout_minutes);

  -- 2. reuse the open session if there is one
  select id into v_session_id
  from rig_session
  where rig_id = p_rig_id and ended_at is null;

  if v_session_id is not null then
    return v_session_id;
  end if;

  -- 3. otherwise create an anonymous one (race-safe thanks to the unique index)
  insert into rig_session (rig_id, driver_id, started_at, last_activity_at)
  values (p_rig_id, null, now(), now())
  on conflict (rig_id) where ended_at is null do nothing
  returning id into v_session_id;

  -- 4. if we lost the race, the insert returned nothing: fetch the winner's session
  if v_session_id is null then
    select id into v_session_id
    from rig_session
    where rig_id = p_rig_id and ended_at is null;
  end if;

  return v_session_id;
end;
$$;


ALTER FUNCTION "public"."get_or_create_active_session"("p_rig_id" "uuid", "p_timeout_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id, 
    split_part(new.email::TEXT, '@', 1),
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_lap"("p_rig_id" "uuid", "p_timeout_minutes" integer, "p_for_testing" boolean, "p_track_id" integer, "p_car_id" integer, "p_lap_time_ms" integer, "p_s1_ms" integer, "p_s2_ms" integer, "p_s3_ms" integer) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
declare
  v_session_id uuid;
  v_driver_id uuid;
  v_lap_id int;
begin
  v_session_id := get_or_create_active_session(p_rig_id, p_timeout_minutes);

  select driver_id into v_driver_id
  from rig_session
  where id = v_session_id;

  insert into lap_time (
    rig_id, session_id, driver_id, track_id, car_id,
    time_milliseconds, sector1_ms, sector2_ms, sector3_ms,
    for_testing
  )
  values (
    p_rig_id, v_session_id, v_driver_id, p_track_id, p_car_id,
    p_lap_time_ms,
    nullif(p_s1_ms, 0), nullif(p_s2_ms, 0), nullif(p_s3_ms, 0),
    p_for_testing
  )
  on conflict (track_id, car_id, time_milliseconds, sector1_ms, sector2_ms, sector3_ms) do nothing
  returning id into v_lap_id;

  update rig_session
  set last_activity_at = now()
  where id = v_session_id;

  return v_lap_id;
end;
$$;


ALTER FUNCTION "public"."insert_lap"("p_rig_id" "uuid", "p_timeout_minutes" integer, "p_for_testing" boolean, "p_track_id" integer, "p_car_id" integer, "p_lap_time_ms" integer, "p_s1_ms" integer, "p_s2_ms" integer, "p_s3_ms" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rig_status"("p_rig_id" "uuid", "p_expiry_minutes" integer) RETURNS TABLE("rig_id" "uuid", "rig_name" "text", "session_active" boolean, "session_id" "uuid", "driver_id" "uuid", "driver_name" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select
    r.id,
    r.name,
    s.id is not null,
    s.id,
    s.driver_id,
    p.username
  from rig r
  left join lateral (
    select id, driver_id
    from rig_session
    where rig_id = r.id
      and ended_at is null
      and last_activity_at > now() - make_interval(mins => p_expiry_minutes)
    order by last_activity_at desc
    limit 1
  ) s on true
  left join profiles p on p.id = s.driver_id
  where r.id = p_rig_id;
$$;


ALTER FUNCTION "public"."rig_status"("p_rig_id" "uuid", "p_expiry_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_laptime_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  my_rank integer;
BEGIN
IF NEW.time_milliseconds IS NULL THEN
    NEW.was_podium := false;
    RETURN NEW;
  END IF;

  SELECT COUNT(*) + 1
  INTO my_rank
  FROM public.lap_time
  WHERE track_id = NEW.track_id
    AND (
      time_milliseconds < NEW.time_milliseconds
      OR (time_milliseconds = NEW.time_milliseconds)
    );

  NEW.was_podium := (my_rank <= 3);
  
  IF my_rank = 1 THEN
    NEW.pole_rating = 1;
  END IF;
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."set_laptime_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pole_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  lap record;
BEGIN

SELECT l.*
INTO lap
FROM lap_time l
where l.track_id = NEW.track_id
order by l.time_milliseconds asc
limit 1;

raise log '[Update pole rating] TR Before: %', lap.pole_rating;

IF lap.driver_id <> NEW.driver_id AND lap.id IS NOT NULL THEN
  UPDATE lap_time
  SET pole_rating = lap.pole_rating + 1
  WHERE lap_time.id = lap.id;
  
  raise log '[Update pole rating] TR After: %', lap.pole_rating + 1;
END IF;

RETURN NEW;

END;$$;


ALTER FUNCTION "public"."update_pole_rating"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."car" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "make_id" bigint NOT NULL,
    "model" "text" NOT NULL,
    "year" numeric NOT NULL,
    "category_id" bigint,
    "simhub_carid" "text"
);


ALTER TABLE "public"."car" OWNER TO "postgres";


COMMENT ON TABLE "public"."car" IS 'The car that is associated with a specific lap time';



COMMENT ON COLUMN "public"."car"."simhub_carid" IS 'Simhub''s GameData.CarId property value';



CREATE TABLE IF NOT EXISTS "public"."car_category" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."car_category" OWNER TO "postgres";


COMMENT ON TABLE "public"."car_category" IS 'the category in which the car is in.';



ALTER TABLE "public"."car_category" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."car_category_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."car" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."car_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."car_make" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "logo" "bytea"
);


ALTER TABLE "public"."car_make" OWNER TO "postgres";


COMMENT ON TABLE "public"."car_make" IS 'the car''s brand, also associated with a logo';



ALTER TABLE "public"."car_make" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."car_make_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."game" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "logo" "bytea",
    "banner" "bytea"
);


ALTER TABLE "public"."game" OWNER TO "postgres";


COMMENT ON TABLE "public"."game" IS 'In which game was the lap made?';



ALTER TABLE "public"."game" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."game_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lap_time" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "driver_id" "uuid" DEFAULT "auth"."uid"(),
    "track_id" bigint NOT NULL,
    "car_id" bigint NOT NULL,
    "wet" boolean DEFAULT false NOT NULL,
    "time_milliseconds" integer NOT NULL,
    "was_podium" boolean DEFAULT false NOT NULL,
    "pole_rating" smallint DEFAULT '0'::smallint NOT NULL,
    "for_testing" boolean DEFAULT false NOT NULL,
    "game_id" bigint,
    "tournament_id" bigint,
    "rig_id" "uuid",
    "session_id" "uuid",
    "sector1_ms" integer,
    "sector2_ms" integer,
    "sector3_ms" integer,
    "driver_assigned_by" "uuid",
    "driver_assigned_at" timestamp with time zone,
    "dismissed_at" timestamp with time zone,
    CONSTRAINT "lap_time_for_testing_check" CHECK (("for_testing" = ANY (ARRAY[true, false]))),
    CONSTRAINT "lap_time_game_id_check" CHECK (("game_id" > 0)),
    CONSTRAINT "lap_time_pole_rating_check" CHECK (("pole_rating" >= 0)),
    CONSTRAINT "lap_time_sector1_ms_check" CHECK (("sector1_ms" > 0)),
    CONSTRAINT "lap_time_sector2_ms_check" CHECK (("sector2_ms" > 0)),
    CONSTRAINT "lap_time_sector3_ms_check" CHECK (("sector3_ms" > 0)),
    CONSTRAINT "lap_time_time_milliseconds_check" CHECK (("time_milliseconds" > 0)),
    CONSTRAINT "lap_time_tournament_id_check" CHECK (("tournament_id" > 0)),
    CONSTRAINT "lap_time_was_podium_check" CHECK (("was_podium" = ANY (ARRAY[true, false])))
);


ALTER TABLE "public"."lap_time" OWNER TO "postgres";


COMMENT ON TABLE "public"."lap_time" IS 'a set time made with a certain car, in a certain track, by a certain user';



COMMENT ON COLUMN "public"."lap_time"."time_milliseconds" IS 'Lap time in total milliseconds';



COMMENT ON COLUMN "public"."lap_time"."was_podium" IS 'Was the lap time on the podium (top 3) of the track when it was submitted?';



COMMENT ON COLUMN "public"."lap_time"."pole_rating" IS 'Tracker of how dominant the lap was. If pole = 1. Subsequent slower lap times from other drivers will increment this rating.';



COMMENT ON COLUMN "public"."lap_time"."for_testing" IS 'True if i''s a testing record. This way, it won''t show up in the prod app.';



COMMENT ON COLUMN "public"."lap_time"."game_id" IS 'The game where the lap was made';



COMMENT ON COLUMN "public"."lap_time"."tournament_id" IS '(Optional) tournament to associate this laptime with';



COMMENT ON COLUMN "public"."lap_time"."rig_id" IS 'the rig that uploaded this lap (if any)';



COMMENT ON COLUMN "public"."lap_time"."driver_assigned_by" IS 'who assigned this lap to the driver_id? could be self or other';



COMMENT ON COLUMN "public"."lap_time"."driver_assigned_at" IS 'logging timestamp of when the driver was assigned';



COMMENT ON COLUMN "public"."lap_time"."dismissed_at" IS 'when was the lap dismissed (soft-delete)';



ALTER TABLE "public"."lap_time" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lap_time_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "bio" "text",
    CONSTRAINT "profiles_bio_check" CHECK (("length"("bio") <= 100))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."bio" IS 'A 100-char text field for the user to fill with whatever they want. It will be quoted and italicized in the front-end.';



CREATE TABLE IF NOT EXISTS "public"."race_track" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "length" numeric,
    "country_code" "text",
    "simhub_trackid" "text",
    CONSTRAINT "race_track_country_code_check" CHECK (("length"("country_code") = 2))
);


ALTER TABLE "public"."race_track" OWNER TO "postgres";


COMMENT ON TABLE "public"."race_track" IS 'The race track where users will race and set times on.';



COMMENT ON COLUMN "public"."race_track"."country_code" IS '2-length code of the track''s country';



COMMENT ON COLUMN "public"."race_track"."simhub_trackid" IS 'SimHub''s ameData.TrackId property value';



CREATE OR REPLACE VIEW "public"."listing_recent_laptimes" WITH ("security_invoker"='on') AS
 SELECT "l"."created_at",
    "l"."game_id",
    "driver"."id" AS "driverid",
    "driver"."username" AS "driver",
    "car_make"."name" AS "car_make",
    "car"."model" AS "car_model",
    "track"."id" AS "trackid",
    "track"."name" AS "track_name",
    "l"."time_milliseconds" AS "laptime",
    "lag"("l"."time_milliseconds") OVER (PARTITION BY "l"."driver_id", "l"."track_id" ORDER BY "l"."created_at") AS "previous_laptime",
    ("l"."time_milliseconds" = "min"("l"."time_milliseconds") OVER (PARTITION BY "l"."track_id", "l"."driver_id")) AS "is_personal_best",
    ("l"."time_milliseconds" = "min"("l"."time_milliseconds") OVER (PARTITION BY "l"."track_id")) AS "is_track_record"
   FROM (((("public"."lap_time" "l"
     JOIN "public"."profiles" "driver" ON (("driver"."id" = "l"."driver_id")))
     JOIN "public"."car" ON (("car"."id" = "l"."car_id")))
     JOIN "public"."car_make" ON (("car_make"."id" = "car"."make_id")))
     JOIN "public"."race_track" "track" ON (("track"."id" = "l"."track_id")))
  WHERE ("l"."for_testing" = false)
  ORDER BY "l"."created_at" DESC;


ALTER TABLE "public"."listing_recent_laptimes" OWNER TO "postgres";


ALTER TABLE "public"."race_track" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."race-track_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."reference_time" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "time_ms" integer NOT NULL,
    "track_id" bigint NOT NULL,
    "category_id" bigint NOT NULL,
    "game_id" bigint NOT NULL,
    CONSTRAINT "reference_time_game_id_check" CHECK (("game_id" > 0))
);


ALTER TABLE "public"."reference_time" OWNER TO "postgres";


COMMENT ON TABLE "public"."reference_time" IS 'Tempo de referencia por onde se vão calcular as diffs (101% = Alien, etc)';



ALTER TABLE "public"."reference_time" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."reference_time_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."rig" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."rig" OWNER TO "postgres";


COMMENT ON TABLE "public"."rig" IS 'Rigs are simracing cockpits that want to upload lap and session data';



CREATE TABLE IF NOT EXISTS "public"."rig_drivers" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "rig_id" "uuid" NOT NULL,
    "driver_id" "uuid" NOT NULL,
    "last_connected_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rig_drivers" OWNER TO "postgres";


COMMENT ON TABLE "public"."rig_drivers" IS 'N:M relation between rigs and drivers, to keep history of driver''s rigs';



ALTER TABLE "public"."rig_drivers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."rig_drivers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."rig_session" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "rig_id" "uuid" NOT NULL,
    "driver_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "last_activity_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rig_session" OWNER TO "postgres";


COMMENT ON TABLE "public"."rig_session" IS 'Keeps a history of sessions that happened in rigs';



COMMENT ON COLUMN "public"."rig_session"."last_activity_at" IS 'manages session expiry date';



CREATE TABLE IF NOT EXISTS "public"."rig_stats" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "session_stats" "json",
    "session_updated_at" timestamp with time zone,
    "lap_stats" "json",
    "lap_updated_at" timestamp with time zone
);


ALTER TABLE "public"."rig_stats" OWNER TO "postgres";


COMMENT ON TABLE "public"."rig_stats" IS 'Telemetry and stats that rigs can update';



CREATE TABLE IF NOT EXISTS "public"."tournament" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "public"."TournamentStatus" DEFAULT 'Draft'::"public"."TournamentStatus" NOT NULL,
    "scoring_type" "public"."TournamentScoring" DEFAULT 'Aggregate'::"public"."TournamentScoring" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "is_private" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."tournament" OWNER TO "postgres";


COMMENT ON TABLE "public"."tournament" IS 'Tournaments are events created by users to set up a competition between drivers in set tracks';



ALTER TABLE "public"."tournament" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tournament_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tournament_participant" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tournament_id" bigint NOT NULL,
    "driver_id" "uuid" NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."tournament_participant" OWNER TO "postgres";


COMMENT ON TABLE "public"."tournament_participant" IS 'Drivers joined to the tournament';



ALTER TABLE "public"."tournament_participant" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tournament_participant_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tournament_track" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tournament_id" bigint NOT NULL,
    "track_id" bigint NOT NULL,
    "order_index" smallint
);


ALTER TABLE "public"."tournament_track" OWNER TO "postgres";


COMMENT ON TABLE "public"."tournament_track" IS 'The tracks that compose said tournament';



ALTER TABLE "public"."tournament_track" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tournament_track_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."car_category"
    ADD CONSTRAINT "car_category_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."car_category"
    ADD CONSTRAINT "car_category_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."car_make"
    ADD CONSTRAINT "car_make_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."car_make"
    ADD CONSTRAINT "car_make_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."car"
    ADD CONSTRAINT "car_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."car"
    ADD CONSTRAINT "car_simhub_carid_key" UNIQUE ("simhub_carid");



ALTER TABLE ONLY "public"."game"
    ADD CONSTRAINT "game_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."game"
    ADD CONSTRAINT "game_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lap_time"
    ADD CONSTRAINT "lap_time_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."race_track"
    ADD CONSTRAINT "race-track_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."race_track"
    ADD CONSTRAINT "race-track_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."race_track"
    ADD CONSTRAINT "race_track_simhub_trackid_key" UNIQUE ("simhub_trackid");



ALTER TABLE ONLY "public"."reference_time"
    ADD CONSTRAINT "reference_time_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rig_drivers"
    ADD CONSTRAINT "rig_drivers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rig"
    ADD CONSTRAINT "rig_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."rig"
    ADD CONSTRAINT "rig_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rig_session"
    ADD CONSTRAINT "rig_session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rig_stats"
    ADD CONSTRAINT "rig_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rig_drivers"
    ADD CONSTRAINT "rigs_drivers_rig_id_driver_id_key" UNIQUE ("rig_id", "driver_id");



ALTER TABLE ONLY "public"."tournament_participant"
    ADD CONSTRAINT "tournament_participant_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament"
    ADD CONSTRAINT "tournament_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_track"
    ADD CONSTRAINT "tournament_track_pkey" PRIMARY KEY ("id");



CREATE INDEX "car_make_id_category_id_idx" ON "public"."car" USING "btree" ("make_id", "category_id");



CREATE UNIQUE INDEX "lap_time_dedupe_uniq" ON "public"."lap_time" USING "btree" ("track_id", "car_id", "time_milliseconds", "sector1_ms", "sector2_ms", "sector3_ms") NULLS NOT DISTINCT;



CREATE INDEX "lap_time_driver_id_track_id_car_id_idx" ON "public"."lap_time" USING "btree" ("driver_id", "track_id", "car_id");



CREATE INDEX "lap_time_pole_rating_was_podium_idx" ON "public"."lap_time" USING "btree" ("pole_rating", "was_podium");



CREATE INDEX "lap_time_time_milliseconds_car_id_track_id_idx" ON "public"."lap_time" USING "btree" ("time_milliseconds", "car_id", "track_id");



CREATE UNIQUE INDEX "one_active_session_per_rig" ON "public"."rig_session" USING "btree" ("rig_id") WHERE ("ended_at" IS NULL);



CREATE OR REPLACE TRIGGER "set_podium_and_pole_rating" BEFORE INSERT ON "public"."lap_time" FOR EACH ROW EXECUTE FUNCTION "public"."set_laptime_settings"();



CREATE OR REPLACE TRIGGER "update_TR_pole_rating" AFTER INSERT ON "public"."lap_time" FOR EACH ROW EXECUTE FUNCTION "public"."update_pole_rating"();



ALTER TABLE ONLY "public"."car"
    ADD CONSTRAINT "car_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."car_category"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."car"
    ADD CONSTRAINT "car_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "public"."car_make"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lap_time"
    ADD CONSTRAINT "lap_time_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."car"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lap_time"
    ADD CONSTRAINT "lap_time_driver_assigned_by_fkey" FOREIGN KEY ("driver_assigned_by") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lap_time"
    ADD CONSTRAINT "lap_time_driver_id_fkey1" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lap_time"
    ADD CONSTRAINT "lap_time_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lap_time"
    ADD CONSTRAINT "lap_time_rig_id_fkey" FOREIGN KEY ("rig_id") REFERENCES "public"."rig"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lap_time"
    ADD CONSTRAINT "lap_time_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."rig_session"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lap_time"
    ADD CONSTRAINT "lap_time_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lap_time"
    ADD CONSTRAINT "lap_time_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."race_track"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reference_time"
    ADD CONSTRAINT "reference_time_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."car_category"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."reference_time"
    ADD CONSTRAINT "reference_time_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."reference_time"
    ADD CONSTRAINT "reference_time_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."race_track"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."rig_drivers"
    ADD CONSTRAINT "rig_drivers_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rig_drivers"
    ADD CONSTRAINT "rig_drivers_rig_id_fkey" FOREIGN KEY ("rig_id") REFERENCES "public"."rig"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rig_session"
    ADD CONSTRAINT "rig_session_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rig_session"
    ADD CONSTRAINT "rig_session_rig_id_fkey" FOREIGN KEY ("rig_id") REFERENCES "public"."rig"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rig_stats"
    ADD CONSTRAINT "rig_stats_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."rig"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_participant"
    ADD CONSTRAINT "tournament_participant_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_participant"
    ADD CONSTRAINT "tournament_participant_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_track"
    ADD CONSTRAINT "tournament_track_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_track"
    ADD CONSTRAINT "tournament_track_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."race_track"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



CREATE POLICY "Anyone can see rigs" ON "public"."rig" FOR SELECT USING (true);



CREATE POLICY "Anyone can update stats" ON "public"."rig_stats" FOR UPDATE USING (true);



CREATE POLICY "Auth users can create their own" ON "public"."rig_drivers" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "driver_id"));



CREATE POLICY "Auth users can see rig_drivers" ON "public"."rig_drivers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Auth users can update their own" ON "public"."rig_drivers" FOR UPDATE TO "authenticated" USING (true) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "driver_id"));



CREATE POLICY "Enable delete for auth users" ON "public"."rig_stats" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."rig_session" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for users based on user_id" ON "public"."lap_time" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "driver_id"));



CREATE POLICY "Enable read access for all users" ON "public"."game" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."rig_session" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."rig_stats" FOR SELECT USING (true);



CREATE POLICY "Enable update for all users " ON "public"."rig_session" FOR UPDATE USING (true);



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "all can see race tracks" ON "public"."race_track" FOR SELECT USING (true);



ALTER TABLE "public"."car" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."car_category" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."car_make" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "everyone can see lap times" ON "public"."lap_time" FOR SELECT USING (true);



ALTER TABLE "public"."game" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lap_time" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public can read car" ON "public"."car" FOR SELECT USING (true);



CREATE POLICY "public can read car_category" ON "public"."car_category" FOR SELECT USING (true);



CREATE POLICY "public can read car_makes" ON "public"."car_make" FOR SELECT USING (true);



ALTER TABLE "public"."race_track" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reference_time" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rig" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rig_drivers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rig_session" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rig_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament_participant" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament_track" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user can update other laps (pole_rating)" ON "public"."lap_time" FOR UPDATE TO "authenticated" USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rig";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rig_stats";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON FUNCTION "public"."connect_to_rig"("p_rig_id" "uuid", "p_driver_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."connect_to_rig"("p_rig_id" "uuid", "p_driver_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."connect_to_rig"("p_rig_id" "uuid", "p_driver_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."disconnect_from_rig"("p_rig_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."disconnect_from_rig"("p_rig_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."disconnect_from_rig"("p_rig_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_driver_timeline"("driverid" "uuid", "testing" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_driver_timeline"("driverid" "uuid", "testing" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_driver_timeline"("driverid" "uuid", "testing" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leaderboard_by_track"("track" bigint, "category" bigint, "testing" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_leaderboard_by_track"("track" bigint, "category" bigint, "testing" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leaderboard_by_track"("track" bigint, "category" bigint, "testing" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_active_session"("p_rig_id" "uuid", "p_timeout_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_active_session"("p_rig_id" "uuid", "p_timeout_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_active_session"("p_rig_id" "uuid", "p_timeout_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_lap"("p_rig_id" "uuid", "p_timeout_minutes" integer, "p_for_testing" boolean, "p_track_id" integer, "p_car_id" integer, "p_lap_time_ms" integer, "p_s1_ms" integer, "p_s2_ms" integer, "p_s3_ms" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_lap"("p_rig_id" "uuid", "p_timeout_minutes" integer, "p_for_testing" boolean, "p_track_id" integer, "p_car_id" integer, "p_lap_time_ms" integer, "p_s1_ms" integer, "p_s2_ms" integer, "p_s3_ms" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_lap"("p_rig_id" "uuid", "p_timeout_minutes" integer, "p_for_testing" boolean, "p_track_id" integer, "p_car_id" integer, "p_lap_time_ms" integer, "p_s1_ms" integer, "p_s2_ms" integer, "p_s3_ms" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."rig_status"("p_rig_id" "uuid", "p_expiry_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."rig_status"("p_rig_id" "uuid", "p_expiry_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."rig_status"("p_rig_id" "uuid", "p_expiry_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_laptime_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_laptime_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_laptime_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pole_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pole_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pole_rating"() TO "service_role";


















GRANT ALL ON TABLE "public"."car" TO "anon";
GRANT ALL ON TABLE "public"."car" TO "authenticated";
GRANT ALL ON TABLE "public"."car" TO "service_role";



GRANT ALL ON TABLE "public"."car_category" TO "anon";
GRANT ALL ON TABLE "public"."car_category" TO "authenticated";
GRANT ALL ON TABLE "public"."car_category" TO "service_role";



GRANT ALL ON SEQUENCE "public"."car_category_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."car_category_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."car_category_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."car_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."car_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."car_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."car_make" TO "anon";
GRANT ALL ON TABLE "public"."car_make" TO "authenticated";
GRANT ALL ON TABLE "public"."car_make" TO "service_role";



GRANT ALL ON SEQUENCE "public"."car_make_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."car_make_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."car_make_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."game" TO "anon";
GRANT ALL ON TABLE "public"."game" TO "authenticated";
GRANT ALL ON TABLE "public"."game" TO "service_role";



GRANT ALL ON SEQUENCE "public"."game_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."game_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."game_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lap_time" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE ON TABLE "public"."lap_time" TO "authenticated";
-- Added by hand: the dump omits this REVOKE, but the default privileges in
-- public grant ALL on new tables, so table-wide UPDATE must be removed
-- explicitly. authenticated may only UPDATE pole_rating (granted below).
REVOKE UPDATE ON TABLE "public"."lap_time" FROM "authenticated";
GRANT ALL ON TABLE "public"."lap_time" TO "service_role";



GRANT UPDATE("pole_rating") ON TABLE "public"."lap_time" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."lap_time_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lap_time_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lap_time_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."race_track" TO "anon";
GRANT ALL ON TABLE "public"."race_track" TO "authenticated";
GRANT ALL ON TABLE "public"."race_track" TO "service_role";



GRANT ALL ON TABLE "public"."listing_recent_laptimes" TO "anon";
GRANT ALL ON TABLE "public"."listing_recent_laptimes" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_recent_laptimes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."race-track_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."race-track_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."race-track_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."reference_time" TO "anon";
GRANT ALL ON TABLE "public"."reference_time" TO "authenticated";
GRANT ALL ON TABLE "public"."reference_time" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reference_time_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reference_time_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reference_time_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rig" TO "anon";
GRANT ALL ON TABLE "public"."rig" TO "authenticated";
GRANT ALL ON TABLE "public"."rig" TO "service_role";



GRANT ALL ON TABLE "public"."rig_drivers" TO "anon";
GRANT ALL ON TABLE "public"."rig_drivers" TO "authenticated";
GRANT ALL ON TABLE "public"."rig_drivers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rig_drivers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rig_drivers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rig_drivers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rig_session" TO "anon";
GRANT ALL ON TABLE "public"."rig_session" TO "authenticated";
GRANT ALL ON TABLE "public"."rig_session" TO "service_role";



GRANT ALL ON TABLE "public"."rig_stats" TO "anon";
GRANT ALL ON TABLE "public"."rig_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."rig_stats" TO "service_role";



GRANT ALL ON TABLE "public"."tournament" TO "anon";
GRANT ALL ON TABLE "public"."tournament" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tournament_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tournament_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tournament_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_participant" TO "anon";
GRANT ALL ON TABLE "public"."tournament_participant" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_participant" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tournament_participant_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tournament_participant_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tournament_participant_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_track" TO "anon";
GRANT ALL ON TABLE "public"."tournament_track" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_track" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tournament_track_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tournament_track_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tournament_track_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";































