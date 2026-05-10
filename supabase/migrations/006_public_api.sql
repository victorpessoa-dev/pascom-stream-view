create or replace view public.public_stats as
select
  (
    select count(*)::int
    from public.telao_sessions
  ) as telao_total_views,
  (
    select coalesce(
      sum(extract(epoch from (ts.ended_at - ts.started_at))),
      0
    )::int
    from public.telao_sessions ts
    where ts.ended_at is not null
  ) as telao_total_seconds,
  (
    select count(*)::int
    from public.sponsors
  ) as sponsors_total,
  (
    select count(*)::int
    from public.sponsors
    where active
  ) as sponsors_active,
  (
    select count(*)::int
    from public.overlays
  ) as overlays_total,
  (
    select coalesce(sum(views), 0)::int
    from public.sponsors
  ) as sponsor_views,
  (
    select coalesce(sum(total_seconds), 0)::int
    from public.sponsors
  ) as sponsor_total_seconds,
  (
    select coalesce(sum(duration_seconds), 0)::int
    from public.sponsors
    where active
  ) as sponsor_round_seconds,
  now() as updated_at;

drop function if exists public.get_public_stats();
create or replace function public.get_public_stats()
returns table (
  telao_total_views integer,
  telao_total_seconds integer,
  sponsors_total integer,
  sponsors_active integer,
  overlays_total integer,
  sponsor_views integer,
  sponsor_total_seconds integer,
  sponsor_round_seconds integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select * from public.public_stats;
$$;

grant execute on function public.get_public_stats() to anon, authenticated;

drop function if exists public.get_public_sponsors();
create or replace function public.get_public_sponsors()
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
  last_displayed_at timestamptz
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
    s.last_displayed_at
  from public.sponsors s
  where s.active
  order by case when s.kind = 'MASTER' then 0 else 1 end, s.created_at desc;
$$;

grant execute on function public.get_public_sponsors() to anon, authenticated;

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
  order by s.active desc, s.last_displayed_at desc nulls last, s.created_at desc;
$$;

grant execute on function public.get_public_sponsor_directory() to anon, authenticated;

drop function if exists public.get_public_overlay(text);
create or replace function public.get_public_overlay(public_id_arg text)
returns table (
  id uuid,
  public_id text,
  name text,
  width integer,
  height integer,
  data jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.public_id,
    o.name,
    o.width,
    o.height,
    o.data,
    o.updated_at
  from public.overlays o
  where o.is_public
    and o.public_id = public_id_arg
  limit 1;
$$;

grant execute on function public.get_public_overlay(text) to anon, authenticated;

drop function if exists public.get_sponsor_settings();
create or replace function public.get_sponsor_settings()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select value
      from public.app_settings
      where key = 'sponsor_settings'
    ),
    '{}'::jsonb
  );
$$;

grant execute on function public.get_sponsor_settings() to anon, authenticated;

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

  if safe_source <> 'telao' then
    return null;
  end if;

  if coalesce((settings->>'metricsEnabled')::boolean, false) is not true then
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
  select value
  into settings
  from public.app_settings
  where key = 'sponsor_settings';

  if coalesce((settings->>'metricsEnabled')::boolean, false) is not true then
    return;
  end if;

  if sponsor_id is null then
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
  where si.sponsor_id = sponsor_id_arg
  order by si.displayed_at desc;
$$;

grant execute on function public.get_public_sponsor_impressions(uuid) to anon, authenticated;
