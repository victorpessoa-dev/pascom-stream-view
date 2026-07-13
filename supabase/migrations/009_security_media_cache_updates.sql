-- Security and media hardening for existing deployments.

alter table public.profiles enable row level security;
alter table public.sponsors enable row level security;
alter table public.overlays enable row level security;
alter table public.app_settings enable row level security;
alter table public.telao_sessions enable row level security;
alter table public.sponsor_impressions enable row level security;

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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sponsors_media_type_matches_url'
      and conrelid = 'public.sponsors'::regclass
  ) then
    alter table public.sponsors
      add constraint sponsors_media_type_matches_url
      check (
        media_type in ('image', 'video')
        and length(trim(coalesce(media_url, image_url, ''))) > 0
      )
      not valid;
  end if;
end $$;
