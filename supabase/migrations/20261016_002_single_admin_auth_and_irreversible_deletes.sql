-- Ownership and authentication hardening for the one-admin-per-church model.
-- This migration deliberately uses physical DELETEs: there is no soft delete,
-- restore operation, created_by or deleted_by column in this model.
do $$
begin
  if exists (
    select 1 from public.admin_church_association
    group by church_id having count(*) > 1
  ) then
    raise exception 'A igreja possui mais de um administrador. Resolva os vínculos duplicados antes de aplicar esta migração.';
  end if;
end $$;

alter table public.churches
add column if not exists admin_id uuid references auth.users (id) on delete restrict;

update public.churches c
set
  admin_id = a.admin_id
from
  public.admin_church_association a
where
  a.church_id = c.id
  and c.admin_id is null;

alter table public.churches
alter column admin_id
set not null;

-- The association table represented the old multi-admin model and must not be
-- used by application code after this migration.
drop table if exists public.admin_church_association;

create or replace function public.owns_church (target_church_id uuid) returns boolean language sql stable security definer
set
  search_path = public as $$
  select exists (
    select 1 from public.churches c
    where c.id = target_church_id and c.admin_id = auth.uid()
  );
$$;

create or replace function public.is_admin () returns boolean language sql stable security definer
set
  search_path = public as $$
  select exists (select 1 from public.churches c where c.admin_id = auth.uid());
$$;

-- Existing SECURITY DEFINER RPCs only checked "is any admin" and could bypass
-- row ownership. The client falls back to the RLS-protected table operations.
drop function if exists public.create_admin_sponsor (
  text,
  public.sponsor_kind,
  text,
  public.media_type,
  text,
  integer,
  boolean
);

drop function if exists public.update_admin_sponsor (
  uuid,
  text,
  public.sponsor_kind,
  text,
  public.media_type,
  text,
  integer,
  boolean
);

create or replace function public.owns_media_object (object_name text) returns boolean language plpgsql stable security definer
set
  search_path = public,
  storage as $$
declare
  church_folder uuid;
begin
  church_folder := (storage.foldername(object_name))[1]::uuid;
  return public.owns_church(church_folder);
exception when invalid_text_representation then
  return false;
end;
$$;

alter table public.churches enable row level security;

alter table public.profiles enable row level security;

alter table public.sponsors enable row level security;

alter table public.overlays enable row level security;

alter table public.app_settings enable row level security;

alter table public.sponsor_impressions enable row level security;

drop policy if exists churches_public_read_active on public.churches;

create policy churches_public_read_active on public.churches for
select
  using (
    is_active
    or admin_id = auth.uid ()
  );

drop policy if exists churches_insert_own on public.churches;

create policy churches_insert_own on public.churches for insert to authenticated
with
  check (admin_id = auth.uid ());

drop policy if exists churches_update_own on public.churches;

create policy churches_update_own on public.churches
for update
  to authenticated using (admin_id = auth.uid ())
with
  check (admin_id = auth.uid ());

drop policy if exists churches_delete_own on public.churches;

create policy churches_delete_own on public.churches for delete to authenticated using (admin_id = auth.uid ());

drop policy if exists sponsors_admin_full on public.sponsors;

create policy sponsors_owner_full on public.sponsors for all to authenticated using (public.owns_church (church_id))
with
  check (public.owns_church (church_id));

drop policy if exists overlays_admin_full on public.overlays;

create policy overlays_owner_full on public.overlays for all to authenticated using (public.owns_church (church_id))
with
  check (public.owns_church (church_id));

drop policy if exists app_settings_admin_full on public.app_settings;

create policy app_settings_owner_full on public.app_settings for all to authenticated using (public.owns_church (church_id))
with
  check (public.owns_church (church_id));

drop policy if exists sponsor_impressions_admin_full on public.sponsor_impressions;

create policy sponsor_impressions_owner_read on public.sponsor_impressions for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.sponsors s
      where
        s.id = sponsor_id
        and public.owns_church (s.church_id)
    )
  );

-- Public reads must remain limited to active/public content.
drop policy if exists sponsors_select_public_active on public.sponsors;

create policy sponsors_select_public_active on public.sponsors for
select
  using (active = true);

drop policy if exists overlays_select_public on public.overlays;

create policy overlays_select_public on public.overlays for
select
  using (is_public = true);

drop policy if exists app_settings_select_public on public.app_settings;

create policy app_settings_select_public on public.app_settings for
select
  using (key = 'sponsor_settings');

-- The old global is_admin policies must never grant cross-church access.
drop policy if exists pascom_media_admin_write on storage.objects;

drop policy if exists pascom_media_admin_delete on storage.objects;

drop policy if exists pascom_media_admin_insert on storage.objects;

drop policy if exists pascom_media_admin_update on storage.objects;

create policy pascom_media_owner_write on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'pascom-media'
    and public.owns_media_object (name)
  );

create policy pascom_media_owner_update on storage.objects
for update
  to authenticated using (
    bucket_id = 'pascom-media'
    and public.owns_media_object (name)
  )
with
  check (
    bucket_id = 'pascom-media'
    and public.owns_media_object (name)
  );

create policy pascom_media_owner_delete on storage.objects for delete to authenticated using (
  bucket_id = 'pascom-media'
  and public.owns_media_object (name)
);

-- Supabase Auth configuration required for the email-only model:
-- disable public signups in Auth settings; create access exclusively with
-- auth.admin.inviteUserByEmail from the server-side provisioning endpoint.
