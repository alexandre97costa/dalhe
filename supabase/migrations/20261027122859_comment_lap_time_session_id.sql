-- First migration through the S6 workflow (Sprint 0). Comment only, no schema change.
-- lap_time.session_id was the one column here without a comment on the hosted database.
comment on column public.lap_time.session_id is 'the rig session this lap was driven in (if uploaded by a rig)';
