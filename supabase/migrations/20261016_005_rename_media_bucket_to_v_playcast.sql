-- New uploads use the Virtus PlayCast bucket. The former bucket remains
-- untouched so existing public media URLs continue to resolve during migration.
insert into
  storage.buckets (id, name, public)
values
  ('v-playcast-midia', 'v-playcast-midia', true)
on conflict (id) do update
set
  public = true;

drop policy if exists v_playcast_media_public_read on storage.objects;

create policy v_playcast_media_public_read on storage.objects for
select
  using (bucket_id = 'v-playcast-midia');

drop policy if exists v_playcast_media_owner_insert on storage.objects;

create policy v_playcast_media_owner_insert on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'v-playcast-midia'
    and public.owns_media_object (name)
  );

drop policy if exists v_playcast_media_owner_update on storage.objects;

create policy v_playcast_media_owner_update on storage.objects
for update
  to authenticated using (
    bucket_id = 'v-playcast-midia'
    and public.owns_media_object (name)
  )
with
  check (
    bucket_id = 'v-playcast-midia'
    and public.owns_media_object (name)
  );

drop policy if exists v_playcast_media_owner_delete on storage.objects;

create policy v_playcast_media_owner_delete on storage.objects for delete to authenticated using (
  bucket_id = 'v-playcast-midia'
  and public.owns_media_object (name)
);
