-- Database cascades do not remove Supabase Storage objects. Delete all media
-- owned by the tenant before its church row is removed.
create or replace function public.delete_church_media_objects () returns trigger language plpgsql security definer
set
  search_path = public,
  storage as $$
begin
  delete from storage.objects
  where bucket_id in ('v-playcast-midia', 'pascom-media')
    and name like old.id::text || '/%';

  return old;
end;
$$;

revoke
execute on function public.delete_church_media_objects ()
from
  public,
  anon,
  authenticated;

drop trigger if exists churches_delete_media_before_delete on public.churches;

create trigger churches_delete_media_before_delete before delete on public.churches for each row
execute function public.delete_church_media_objects ();
