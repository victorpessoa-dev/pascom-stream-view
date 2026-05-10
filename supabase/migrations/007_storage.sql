insert into storage.buckets (
  id,
  name,
  public
)
values (
  'pascom-media',
  'pascom-media',
  true
)
on conflict (id)
do update set public = true;

drop policy if exists "pascom_media_public_read" on storage.objects;
create policy "pascom_media_public_read"
on storage.objects
for select
using (bucket_id = 'pascom-media');

drop policy if exists "pascom_media_admin_write" on storage.objects;
create policy "pascom_media_admin_write"
on storage.objects
for all
using (
  bucket_id = 'pascom-media'
  and public.is_admin()
)
with check (
  bucket_id = 'pascom-media'
  and public.is_admin()
);
