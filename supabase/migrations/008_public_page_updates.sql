-- Public page update pack for existing databases.
-- Keeps new installs covered by the base migrations while providing one
-- migration for already-deployed projects.

insert into public.app_settings (
  key,
  value
)
values (
  'admin_settings',
  '{
    "telao": {
      "defaultDurationNormal": 10,
      "defaultDurationMaster": 15
    },
    "appearance": {
      "parishName": "",
      "parishCity": "",
      "parishProfile": "",
      "parishLogoUrl": "/brand/icon-logo.svg",
      "parishCoverUrl": "",
      "parishSocialLinks": []
    }
  }'::jsonb
)
on conflict (key) do nothing;

update public.app_settings
set value = (value - 'overlay' - 'advanced') || jsonb_build_object(
  'telao',
  '{
    "defaultDurationNormal": 10,
    "defaultDurationMaster": 15
  }'::jsonb || (
    coalesce(value->'telao', '{}'::jsonb)
      - 'transitionType'
      - 'transitionDuration'
      - 'autoplay'
      - 'shuffle'
      - 'showProgressBar'
  ),
  'appearance',
  '{
    "parishName": "",
    "parishCity": "",
    "parishProfile": "",
    "parishLogoUrl": "/brand/icon-logo.svg",
    "parishCoverUrl": "",
    "parishSocialLinks": []
  }'::jsonb || (
    coalesce(value->'appearance', '{}'::jsonb)
      - 'accentColor'
      - 'animationsEnabled'
      - 'compactMode'
      - 'parishInstagramUrl'
      - 'parishFacebookUrl'
      - 'parishYoutubeUrl'
      - 'parishWhatsappUrl'
      - 'parishWebsiteUrl'
  )
)
where key = 'admin_settings';

drop function if exists public.get_public_sponsor_directory();
create or replace function public.get_public_sponsor_directory()
returns table (
  id uuid,
  name text,
  kind public.sponsor_kind,
  media_url text,
  media_type public.media_type,
  image_url text,
  website_url text,
  duration_seconds integer,
  views integer,
  total_seconds integer,
  active boolean,
  last_displayed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.name,
    s.kind,
    coalesce(s.media_url, s.image_url) as media_url,
    s.media_type,
    s.image_url,
    s.website_url,
    s.duration_seconds,
    s.views,
    s.total_seconds,
    s.active,
    s.last_displayed_at,
    s.created_at,
    s.updated_at
  from public.sponsors s
  where s.active
  order by s.active desc, s.last_displayed_at desc nulls last, s.created_at desc;
$$;

grant execute on function public.get_public_sponsor_directory() to anon, authenticated;

drop function if exists public.get_public_parish_profile();
create or replace function public.get_public_parish_profile()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'parishName', coalesce(settings.value #>> '{appearance,parishName}', ''),
    'parishCity', coalesce(settings.value #>> '{appearance,parishCity}', ''),
    'parishProfile', coalesce(settings.value #>> '{appearance,parishProfile}', ''),
    'parishLogoUrl', coalesce(nullif(settings.value #>> '{appearance,parishLogoUrl}', ''), '/brand/icon-logo.svg'),
    'parishCoverUrl', coalesce(settings.value #>> '{appearance,parishCoverUrl}', ''),
    'parishSocialLinks', coalesce(settings.value #> '{appearance,parishSocialLinks}', '[]'::jsonb)
  )
  from (
    select coalesce(
      (
        select value
        from public.app_settings
        where key = 'admin_settings'
      ),
      '{}'::jsonb
    ) as value
  ) settings;
$$;

grant execute on function public.get_public_parish_profile() to anon, authenticated;

drop function if exists public.log_sponsor_impression(uuid, timestamptz, integer, text);
create or replace function public.log_sponsor_impression(
  sponsor_id uuid,
  displayed_at_arg timestamptz default now(),
  duration_seconds_arg integer default 0,
  source_arg text default 'telao'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  impression_id uuid;
  settings jsonb;
  sponsor_is_active boolean;
  safe_displayed_at timestamptz := coalesce(displayed_at_arg, now());
  safe_duration integer := least(greatest(coalesce(duration_seconds_arg, 0), 0), 3600);
  safe_source text := coalesce(nullif(trim(source_arg), ''), 'telao');
begin
  if sponsor_id is null then
    raise exception 'sponsor_id is required';
  end if;

  select value
  into settings
  from public.app_settings
  where key = 'sponsor_settings';

  if coalesce((settings->>'metricsEnabled')::boolean, false) is not true then
    return null;
  end if;

  if safe_source not in ('telao', 'telao-master') then
    return null;
  end if;

  select s.active
  into sponsor_is_active
  from public.sponsors s
  where s.id = sponsor_id;

  if coalesce(sponsor_is_active, false) is not true then
    return null;
  end if;

  insert into public.sponsor_impressions (
    sponsor_id,
    displayed_at,
    duration_seconds,
    source
  )
  values (
    sponsor_id,
    safe_displayed_at,
    safe_duration,
    safe_source
  )
  returning id into impression_id;

  update public.sponsors
  set
    views = views + 1,
    total_seconds = total_seconds + safe_duration,
    last_displayed_at = greatest(coalesce(last_displayed_at, safe_displayed_at), safe_displayed_at)
  where id = sponsor_id;

  return impression_id;
end;
$$;

grant execute on function public.log_sponsor_impression(uuid, timestamptz, integer, text) to anon, authenticated;

drop function if exists public.log_sponsor_impressions(jsonb);
create or replace function public.log_sponsor_impressions(logs_arg jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  log_item jsonb;
  impression_id uuid;
  processed integer := 0;
begin
  if logs_arg is null or jsonb_typeof(logs_arg) <> 'array' then
    raise exception 'logs_arg must be a JSON array';
  end if;

  for log_item in
    select value from jsonb_array_elements(logs_arg)
  loop
    impression_id := public.log_sponsor_impression(
      nullif(log_item->>'sponsor_id', '')::uuid,
      coalesce(nullif(log_item->>'displayed_at', '')::timestamptz, now()),
      coalesce(nullif(log_item->>'duration_seconds', '')::integer, 0),
      coalesce(nullif(log_item->>'source', ''), 'telao')
    );
    if impression_id is not null then
      processed := processed + 1;
    end if;
  end loop;

  return processed;
end;
$$;

grant execute on function public.log_sponsor_impressions(jsonb) to anon, authenticated;

drop function if exists public.record_sponsor_view(uuid, integer);
create or replace function public.record_sponsor_view(sponsor_id uuid, seconds integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  settings jsonb;
begin
  if sponsor_id is null then
    return;
  end if;

  select value
  into settings
  from public.app_settings
  where key = 'sponsor_settings';

  if coalesce((settings->>'metricsEnabled')::boolean, false) is not true then
    return;
  end if;

  update public.sponsors
  set
    views = views + 1,
    total_seconds = total_seconds + least(greatest(coalesce(seconds, 0), 0), 3600),
    last_displayed_at = now()
  where id = sponsor_id
    and active = true;
end;
$$;

grant execute on function public.record_sponsor_view(uuid, integer) to anon, authenticated;

drop function if exists public.get_public_sponsor_detail(uuid);
create or replace function public.get_public_sponsor_detail(sponsor_id_arg uuid)
returns table (
  id uuid,
  name text,
  kind public.sponsor_kind,
  media_url text,
  media_type public.media_type,
  image_url text,
  website_url text,
  duration_seconds integer,
  views integer,
  total_seconds integer,
  active boolean,
  last_displayed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.name,
    s.kind,
    coalesce(s.media_url, s.image_url) as media_url,
    s.media_type,
    s.image_url,
    s.website_url,
    s.duration_seconds,
    s.views,
    s.total_seconds,
    s.active,
    s.last_displayed_at,
    s.created_at,
    s.updated_at
  from public.sponsors s
  where s.id = sponsor_id_arg
    and s.active
  limit 1;
$$;

grant execute on function public.get_public_sponsor_detail(uuid) to anon, authenticated;

drop function if exists public.get_public_sponsor_impressions(uuid);
create or replace function public.get_public_sponsor_impressions(sponsor_id_arg uuid)
returns table (
  id uuid,
  displayed_at timestamptz,
  duration_seconds integer,
  source text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    si.id,
    si.displayed_at,
    si.duration_seconds,
    si.source
  from public.sponsor_impressions si
  join public.sponsors s on s.id = si.sponsor_id
  where si.sponsor_id = sponsor_id_arg
    and s.active
  order by si.displayed_at desc;
$$;

grant execute on function public.get_public_sponsor_impressions(uuid) to anon, authenticated;
