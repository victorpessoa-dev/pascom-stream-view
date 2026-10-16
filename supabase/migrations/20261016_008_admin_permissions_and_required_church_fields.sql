-- An invitation grants administrative access before a church is created.
create or replace function public.is_admin () returns boolean language sql stable security definer
set
  search_path = public as $$
  select coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin'
    or exists (select 1 from public.churches where admin_id = auth.uid());
$$;

-- Do not invent a city for historical rows. The constraint is enforced for
-- every new or updated church while preserving existing data for review.
alter table public.churches
add constraint churches_city_required check (
  city is not null
  and length(trim(city)) > 0
) not valid;

alter table public.churches
drop column if exists description;

drop function if exists public.get_public_churches ();

drop function if exists public.get_public_church_by_slug (text);

create function public.get_public_churches () returns table (
  id uuid,
  name text,
  slug text,
  city text,
  logo_url text,
  cover_url text
) language sql stable security definer
set
  search_path = public as $$
  select c.id, c.name, c.slug, c.city, c.logo_url, c.cover_url
  from public.churches c
  where c.is_active
  order by c.name
$$;

create function public.get_public_church_by_slug (slug_arg text) returns table (
  id uuid,
  name text,
  slug text,
  city text,
  logo_url text,
  cover_url text
) language sql stable security definer
set
  search_path = public as $$
  select c.id, c.name, c.slug, c.city, c.logo_url, c.cover_url
  from public.churches c
  where c.slug = slug_arg and c.is_active
  limit 1
$$;

grant
execute on function public.get_public_churches () to anon,
authenticated;

grant
execute on function public.get_public_church_by_slug (text) to anon,
authenticated;
