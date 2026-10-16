-- The public profile had no dedicated column in churches. Keep public data
-- limited to columns that the table models explicitly.
drop function if exists public.get_public_church_by_slug (text);

create function public.get_public_church_by_slug (slug_arg text) returns table (
  id uuid,
  name text,
  slug text,
  city text,
  logo_url text,
  cover_url text,
  social_links jsonb
) language sql stable security definer
set
  search_path = public as $$
  select c.id,c.name,c.slug,c.city,c.logo_url,c.cover_url,c.social_links
  from public.churches c
  where c.slug = slug_arg and c.is_active
  limit 1
$$;

grant execute on function public.get_public_church_by_slug (text) to anon, authenticated;
