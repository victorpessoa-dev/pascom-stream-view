-- A public bucket serves objects through public URLs; it does not need a
-- SELECT policy on storage.objects. Removing this policy prevents clients
-- from enumerating every file through the Storage API.
drop policy if exists v_playcast_media_public_read on storage.objects;
