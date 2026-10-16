-- Adds an administrative RPC for updating sponsors.
-- This avoids direct client-side table updates being blocked by RLS or by
-- post-update select policies, while still requiring public.is_admin().
drop function if exists public.update_admin_sponsor (
  uuid,
  text,
  public.sponsor_kind,
  text,
  public.media_type,
  text,
  integer,
  boolean
);

create or replace function public.update_admin_sponsor (
  sponsor_id_arg uuid,
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
    raise exception 'Acesso administrativo necessario para atualizar patrocinio'
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
  update public.sponsors s
  set
    name = trim(name_arg),
    kind = coalesce(kind_arg, 'NORMAL'::public.sponsor_kind),
    media_url = trim(media_url_arg),
    media_type = coalesce(media_type_arg, 'image'::public.media_type),
    image_url = case
      when coalesce(media_type_arg, 'image'::public.media_type) = 'image'::public.media_type
        then trim(media_url_arg)
      else null
    end,
    website_url = nullif(trim(coalesce(website_url_arg, '')), ''),
    duration_seconds = greatest(coalesce(duration_seconds_arg, 10), 3),
    active = coalesce(active_arg, true)
  where s.id = sponsor_id_arg
  returning
    s.id,
    s.name,
    s.kind,
    s.media_url,
    s.media_type,
    s.image_url,
    s.website_url,
    s.duration_seconds,
    s.active,
    s.views,
    s.total_seconds,
    s.last_displayed_at,
    s.created_at,
    s.updated_at;
end;
$$;

grant
execute on function public.update_admin_sponsor (
  uuid,
  text,
  public.sponsor_kind,
  text,
  public.media_type,
  text,
  integer,
  boolean
) to authenticated;
