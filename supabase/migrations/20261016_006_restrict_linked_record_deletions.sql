-- A church is a complete tenant: deleting it removes its owned application
-- data. Sponsorship impressions are also removed with their sponsorship.
alter table public.profiles
drop constraint if exists profiles_id_fkey,
add constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete restrict;

alter table public.sponsors
drop constraint if exists sponsors_church_id_fkey,
add constraint sponsors_church_id_fkey foreign key (church_id) references public.churches (id) on delete cascade;

alter table public.overlays
drop constraint if exists overlays_church_id_fkey,
add constraint overlays_church_id_fkey foreign key (church_id) references public.churches (id) on delete cascade;

alter table public.app_settings
drop constraint if exists app_settings_church_id_fkey,
add constraint app_settings_church_id_fkey foreign key (church_id) references public.churches (id) on delete cascade;

alter table public.sponsor_impressions
drop constraint if exists sponsor_impressions_sponsor_id_fkey,
add constraint sponsor_impressions_sponsor_id_fkey foreign key (sponsor_id) references public.sponsors (id) on delete cascade;
