-- Exposes only the availability bit needed by onboarding, not church records.
create or replace function public.is_church_slug_available (slug_arg text) returns boolean language sql stable security definer
set
  search_path = public as $$
  select not exists (
    select 1 from public.churches
    where slug = lower(trim(slug_arg))
  )
$$;

grant
execute on function public.is_church_slug_available (text) to anon,
authenticated;
