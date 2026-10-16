-- Virtus PlayCast: consolidated multi-church baseline and media storage limits.
-- Apply after the existing migrations. This migration is idempotent.
create extension if not exists "pgcrypto";

alter table public.churches
alter column created_at
set default now(),
alter column updated_at
set default now();

alter table public.admin_church_association
alter column assigned_at
set default now();

create or replace function public.update_updated_at () returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_churches_updated_at on public.churches;

create trigger update_churches_updated_at before
update on public.churches for each row
execute function public.update_updated_at ();

-- Settings are scoped by church. A key can exist once for each church.
alter table public.app_settings
add column if not exists church_id uuid references public.churches (id) on delete cascade;

alter table public.app_settings
drop constraint if exists app_settings_pkey;

alter table public.app_settings
add primary key (church_id, key);

create index if not exists app_settings_church_id_idx on public.app_settings (church_id);

create index if not exists sponsors_church_active_idx on public.sponsors (church_id, active);

create index if not exists overlays_church_public_idx on public.overlays (church_id, is_public);

-- Storage validation is enforced independently from the browser UI.
-- Images are limited to 8 MiB and videos to 25 MiB.
drop policy if exists "pascom_media_admin_insert" on storage.objects;

create policy "pascom_media_admin_insert" on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'pascom-media'
    and public.is_admin ()
    and (
      (metadata ->> 'mimetype') in ('image/webp', 'image/jpeg', 'image/png')
      and coalesce((metadata ->> 'size')::bigint, 0) <= 8388608
      or (metadata ->> 'mimetype') in ('video/webm', 'video/mp4')
      and coalesce((metadata ->> 'size')::bigint, 0) <= 26214400
    )
  );

drop policy if exists "pascom_media_admin_update" on storage.objects;

create policy "pascom_media_admin_update" on storage.objects
for update
  to authenticated using (
    bucket_id = 'pascom-media'
    and public.is_admin ()
  )
with
  check (
    bucket_id = 'pascom-media'
    and public.is_admin ()
    and (
      (metadata ->> 'mimetype') in ('image/webp', 'image/jpeg', 'image/png')
      and coalesce((metadata ->> 'size')::bigint, 0) <= 8388608
      or (metadata ->> 'mimetype') in ('video/webm', 'video/mp4')
      and coalesce((metadata ->> 'size')::bigint, 0) <= 26214400
    )
  );
