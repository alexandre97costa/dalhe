-- Usernames are unique regardless of case: "Carla" and "carla" can't both exist.
--
-- profiles_username_key (unique on username) stays; this index adds the case-insensitive rule.
-- A clash raises 23505 like before, which the profile save action shows as "already taken".
--
-- Before pushing to hosted, check no two usernames differ only in case, or this fails:
--   select lower(username), count(*) from public.profiles
--   where username is not null group by 1 having count(*) > 1;

create unique index profiles_username_lower_key on public.profiles (lower(username));
