-- Garante que administradores autenticados possam remover mídias substituídas.
drop policy if exists "pascom_media_admin_delete" on storage.objects;

create policy "pascom_media_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pascom-media'
  and public.is_admin()
);
