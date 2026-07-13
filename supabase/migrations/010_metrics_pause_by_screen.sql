-- Allows pausing sponsor impression counters independently by screen.

update public.app_settings
set value = value || jsonb_build_object(
  'metricsPaused',
  '{
    "NORMAL": false,
    "MASTER": false
  }'::jsonb || coalesce(value->'metricsPaused', '{}'::jsonb)
)
where key = 'sponsor_settings';

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
  source_kind text;
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

  source_kind := case when safe_source = 'telao-master' then 'MASTER' else 'NORMAL' end;

  if coalesce((settings #>> array['metricsPaused', source_kind])::boolean, false) is true then
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
