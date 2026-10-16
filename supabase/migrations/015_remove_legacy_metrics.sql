-- Remove only database objects that are no longer used by the application.
-- The historic telao_sessions table is intentionally preserved here: it can
-- contain operational data and should only be removed after a confirmed backup.
drop function if exists public.record_sponsor_view (uuid, integer);

drop function if exists public.get_public_stats ();

drop view if exists public.public_stats;
