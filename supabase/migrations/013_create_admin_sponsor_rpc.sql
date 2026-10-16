-- Adds an administrative RPC for creating sponsors.
-- Create/save now both use RPCs that validate public.is_admin().
drop function if exists public.create_admin_sponsor (
  text,
  public.sponsor_kind,
  text,
  public.media_type,
  text,
  integer,
  boolean
);

create or replace function public.create_admin_sponsor (
  name_arg text,
  kind_arg public.sponsor_kind,
  media_url_arg text,
  media_type_arg public.media_type,
  website_url_arg text default null,
  duration_seconds_arg integer default 10,
  active_arg boolean default true
) returns table (
  id uuid,
  name text,
  kind public.sponsor_kind,
  media_url text,
  media_type public.media_type,
  image_url text,
  website_url text,
  duration_seconds integer,
  active boolean,
  views integer,
  total_seconds integer,
  last_displayed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
) language plpgsql security definer
set
  search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessario para criar patrocinio'
      using errcode = '42501';
  end if;

  if length(trim(coalesce(name_arg, ''))) = 0 then
    raise exception 'Digite um nome para o patrocinio'
      using errcode = '23514';
  end if;

  if length(trim(coalesce(media_url_arg, ''))) = 0 then
    raise exception 'Adicione uma imagem, video ou link'
      using errcode = '23514';
  end if;

  return query
  insert into public.sponsors (
    name,
    kind,
    media_url,
    media_type,
    image_url,
    website_url,
    duration_seconds,
    active
  )
  values (
    trim(name_arg),
    coalesce(kind_arg, 'NORMAL'::public.sponsor_kind),
    trim(media_url_arg),
    coalesce(media_type_arg, 'image'::public.media_type),
    case
      when coalesce(media_type_arg, 'image'::public.media_type) = 'image'::public.media_type
        then trim(media_url_arg)
      else null
    end,
    nullif(trim(coalesce(website_url_arg, '')), ''),
    greatest(coalesce(duration_seconds_arg, 10), 3),
    coalesce(active_arg, true)
  )
  returning
    sponsors.id,
    sponsors.name,
    sponsors.kind,
    sponsors.media_url,
    sponsors.media_type,
    sponsors.image_url,
    sponsors.website_url,
    sponsors.duration_seconds,
    sponsors.active,
    sponsors.views,
    sponsors.total_seconds,
    sponsors.last_displayed_at,
    sponsors.created_at,
    sponsors.updated_at;
end;
$$;

grant
execute on function public.create_admin_sponsor (
  text,
  public.sponsor_kind,
  text,
  public.media_type,
  text,
  integer,
  boolean
) to authenticated;
