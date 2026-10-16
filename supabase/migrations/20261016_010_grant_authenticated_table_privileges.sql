-- RLS policies do not grant SQL table privileges by themselves. The browser
-- Data API uses the authenticated role, so it needs these privileges before
-- the owner policies can evaluate the request.
grant
select
,
update on public.profiles to authenticated;

grant
select
,
  insert,
update,
delete on public.churches to authenticated;

grant
select
,
  insert,
update,
delete on public.sponsors to authenticated;

grant
select
,
  insert,
update,
delete on public.overlays to authenticated;

grant
select
,
  insert,
update,
delete on public.app_settings to authenticated;

grant
select
  on public.sponsor_impressions to authenticated;
