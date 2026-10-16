-- Public content is read through narrowly scoped RPCs. This keeps ownership
-- fields and private church settings out of the Data API response surface.
drop policy if exists churches_read_active_or_owner on public.churches;

drop policy if exists churches_public_read_active on public.churches;

drop policy if exists churches_owner_read on public.churches;

create policy churches_owner_read on public.churches for
select
  to authenticated using (admin_id = auth.uid ());

create or replace function public.get_public_churches () returns table (
  id uuid,
  name text,
  slug text,
  city text,
  description text,
  logo_url text,
  cover_url text
) language sql stable security definer
set
  search_path = public as $$
  select c.id, c.name, c.slug, c.city, c.description, c.logo_url, c.cover_url
  from public.churches c
  where c.is_active
  order by c.name
$$;

create or replace function public.get_public_church_by_slug (slug_arg text) returns table (
  id uuid,
  name text,
  slug text,
  city text,
  description text,
  logo_url text,
  cover_url text
) language sql stable security definer
set
  search_path = public as $$
  select c.id, c.name, c.slug, c.city, c.description, c.logo_url, c.cover_url
  from public.churches c
  where c.slug = slug_arg and c.is_active
  limit 1
$$;

-- Keep public content unavailable when its church is deactivated.
drop policy if exists sponsors_public_active on public.sponsors;

drop policy if exists sponsors_select_public_active on public.sponsors;

create policy sponsors_public_active on public.sponsors for
select
  using (
    active
    and public.is_public_church (church_id)
  );

drop policy if exists overlays_public on public.overlays;

drop policy if exists overlays_select_public on public.overlays;

create policy overlays_public on public.overlays for
select
  using (
    is_public
    and public.is_public_church (church_id)
  );

-- Public sponsor settings are served only by get_sponsor_settings(), which
-- validates that the target church is active.
drop policy if exists app_settings_select_public on public.app_settings;

grant
execute on function public.get_public_churches () to anon,
authenticated;

grant
execute on function public.get_public_church_by_slug (text) to anon,
authenticated;
