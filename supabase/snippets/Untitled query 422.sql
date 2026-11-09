select p.*
from public.profiles p
where p.id not in (
  select distinct public.rig_drivers.driver_id
  from public.rig_drivers
)