create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.is_admin
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email)
  )
  on conflict (id) do update
  set display_name = coalesce(excluded.display_name, public.profiles.display_name);

  return new;
end;
$$;

drop trigger if exists update_overlays_updated_at on public.overlays;
create trigger update_overlays_updated_at
before update on public.overlays
for each row execute procedure public.update_updated_at();

drop trigger if exists update_sponsors_updated_at on public.sponsors;
create trigger update_sponsors_updated_at
before update on public.sponsors
for each row execute procedure public.update_updated_at();

drop trigger if exists update_app_settings_updated_at on public.app_settings;
create trigger update_app_settings_updated_at
before update on public.app_settings
for each row execute procedure public.update_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
