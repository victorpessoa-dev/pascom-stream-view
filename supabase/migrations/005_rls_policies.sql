alter table public.profiles enable row level security;
alter table public.sponsors enable row level security;
alter table public.overlays enable row level security;
alter table public.app_settings enable row level security;
alter table public.telao_sessions enable row level security;
alter table public.sponsor_impressions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id and is_admin = false);

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "sponsors_admin_full" on public.sponsors;
create policy "sponsors_admin_full"
on public.sponsors
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "overlays_admin_full" on public.overlays;
create policy "overlays_admin_full"
on public.overlays
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "app_settings_admin_full" on public.app_settings;
create policy "app_settings_admin_full"
on public.app_settings
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "telao_sessions_admin_full" on public.telao_sessions;
create policy "telao_sessions_admin_full"
on public.telao_sessions
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "sponsor_impressions_admin_full" on public.sponsor_impressions;
create policy "sponsor_impressions_admin_full"
on public.sponsor_impressions
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "sponsors_select_public_active" on public.sponsors;
create policy "sponsors_select_public_active"
on public.sponsors
for select
using (active = true);

drop policy if exists "overlays_select_public" on public.overlays;
create policy "overlays_select_public"
on public.overlays
for select
using (is_public = true);

drop policy if exists "app_settings_select_public" on public.app_settings;
create policy "app_settings_select_public"
on public.app_settings
for select
using (key = 'sponsor_settings');
