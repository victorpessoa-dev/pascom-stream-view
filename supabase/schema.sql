-- =========================================================
-- PASCOM STREAM VIEW - CONSOLIDATED SUPABASE SCHEMA
-- =========================================================
-- This file is the complete schema snapshot.
-- For maintenance, prefer the split files under supabase/migrations/.

-- =========================================================
-- EXTENSIONS
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- TYPES
-- =========================================================

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'sponsor_kind'
  ) then
    create type public.sponsor_kind as enum (
      'NORMAL',
      'MASTER'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'media_type'
  ) then
    create type public.media_type as enum (
      'image',
      'video'
    );
  end if;
end $$;

-- =========================================================
-- TABLES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.sponsor_kind not null default 'NORMAL',
  media_url text,
  media_type public.media_type not null default 'image',
  image_url text,
  website_url text,
  duration_seconds integer not null default 10,
  active boolean not null default true,
  views integer not null default 0,
  total_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsors_duration_positive check (duration_seconds > 0),
  constraint sponsors_media_type_matches_url check (
    media_type in ('image', 'video')
    and length(trim(coalesce(media_url, image_url, ''))) > 0
  ),
  constraint sponsors_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.overlays (
  id uuid primary key default gen_random_uuid(),
  public_id text not null default encode(gen_random_bytes(6), 'hex'),
  name text not null,
  width integer not null default 1920,
  height integer not null default 1080,
  data jsonb not null default '{"elements":[]}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint overlays_size_positive check (width > 0 and height > 0),
  constraint overlays_name_not_blank check (length(trim(name)) > 0),
  constraint overlays_public_id_not_blank check (length(trim(public_id)) > 0),
  constraint overlays_data_shape check (
    jsonb_typeof(data) = 'object'
    and data ? 'elements'
    and jsonb_typeof(data->'elements') = 'array'
  ),
  constraint overlays_public_id_unique unique (public_id)
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint app_settings_key_not_blank check (length(trim(key)) > 0)
);

create table if not exists public.telao_sessions (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  ended_at timestamptz,
  ads_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint telao_sessions_ended_after_started
    check (ended_at is null or ended_at >= started_at)
);

create table if not exists public.sponsor_impressions (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  displayed_at timestamptz not null default now(),
  duration_seconds integer not null default 0,
  source text not null default 'telao',
  created_at timestamptz not null default now(),
  constraint sponsor_impressions_duration_nonnegative check (duration_seconds >= 0),
  constraint sponsor_impressions_source_not_blank check (length(trim(source)) > 0)
);

-- =========================================================
-- LIGHT MIGRATIONS
-- =========================================================

alter table public.sponsors add column if not exists media_url text;
alter table public.sponsors add column if not exists media_type public.media_type not null default 'image';
alter table public.sponsors add column if not exists views integer not null default 0;
alter table public.sponsors add column if not exists total_seconds integer not null default 0;
alter table public.sponsors add column if not exists last_displayed_at timestamptz;
alter table public.sponsors add column if not exists updated_at timestamptz not null default now();
update public.sponsors
set media_url = coalesce(media_url, image_url)
where media_url is null;

alter table public.overlays add column if not exists public_id text;
update public.overlays
set public_id = encode(gen_random_bytes(6), 'hex')
where public_id is null or btrim(public_id) = '';
alter table public.overlays alter column public_id set not null;
alter table public.overlays add column if not exists is_public boolean not null default true;
alter table public.overlays alter column data set default '{"elements":[]}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'overlays_public_id_unique'
      and conrelid = 'public.overlays'::regclass
  ) then
    alter table public.overlays
      add constraint overlays_public_id_unique unique (public_id);
  end if;
end $$;

-- =========================================================
-- HELPERS
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.is_admin
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email)
  )
  on conflict (id) do update
  set display_name = coalesce(excluded.display_name, public.profiles.display_name);

  return new;
end;
$$;

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists update_overlays_updated_at on public.overlays;
create trigger update_overlays_updated_at
before update on public.overlays
for each row execute procedure public.update_updated_at();

drop trigger if exists update_sponsors_updated_at on public.sponsors;
create trigger update_sponsors_updated_at
before update on public.sponsors
for each row execute procedure public.update_updated_at();

drop trigger if exists update_app_settings_updated_at on public.app_settings;
create trigger update_app_settings_updated_at
before update on public.app_settings
for each row execute procedure public.update_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================================================
-- SETTINGS
-- =========================================================

insert into public.app_settings (
  key,
  value
)
values (
  'sponsor_settings',
  '{
    "metricsEnabled": false,
    "metricsPaused": {
      "NORMAL": false,
      "MASTER": false
    },
    "designs": {
      "MASTER": {
        "enabled": false,
        "backgroundEnabled": false,
        "backgroundUrl": "",
        "contentWidth": 72,
        "contentHeight": 72,
        "x": 50,
        "y": 50,
        "objectFit": "contain"
      },
      "NORMAL": {
        "enabled": true,
        "backgroundEnabled": false,
        "backgroundUrl": "",
        "contentWidth": 58,
        "contentHeight": 58,
        "x": 50,
        "y": 50,
        "objectFit": "contain"
      }
    }
  }'::jsonb
)
on conflict (key) do nothing;

update public.app_settings
set value = jsonb_build_object(
  'metricsEnabled',
  coalesce((value->>'metricsEnabled')::boolean, false),
  'metricsPaused',
  '{
    "NORMAL": false,
    "MASTER": false
  }'::jsonb || coalesce(value->'metricsPaused', '{}'::jsonb),
  'designs',
  jsonb_build_object(
    'MASTER',
    '{
      "enabled": false,
      "backgroundEnabled": false,
      "backgroundUrl": "",
      "contentWidth": 72,
      "contentHeight": 72,
      "x": 50,
      "y": 50,
      "objectFit": "contain"
    }'::jsonb || coalesce(value->'designs'->'MASTER', '{}'::jsonb),
    'NORMAL',
    '{
      "enabled": true,
      "backgroundEnabled": false,
      "backgroundUrl": "",
      "contentWidth": 58,
      "contentHeight": 58,
      "x": 50,
      "y": 50,
      "objectFit": "contain"
    }'::jsonb || coalesce(value->'designs'->'NORMAL', '{}'::jsonb)
  )
)
where key = 'sponsor_settings';

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

-- =========================================================
-- RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.sponsors enable row level security;
alter table public.overlays enable row level security;
alter table public.app_settings enable row level security;
alter table public.telao_sessions enable row level security;
alter table public.sponsor_impressions enable row level security;

-- =========================================================
-- POLICIES: PROFILES
-- =========================================================

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id and is_admin = false);

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles
for update
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- POLICIES: ADMIN
-- =========================================================

drop policy if exists "sponsors_admin_full" on public.sponsors;
create policy "sponsors_admin_full"
on public.sponsors
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "overlays_admin_full" on public.overlays;
create policy "overlays_admin_full"
on public.overlays
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "app_settings_admin_full" on public.app_settings;
create policy "app_settings_admin_full"
on public.app_settings
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "telao_sessions_admin_full" on public.telao_sessions;
create policy "telao_sessions_admin_full"
on public.telao_sessions
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "sponsor_impressions_admin_full" on public.sponsor_impressions;
create policy "sponsor_impressions_admin_full"
on public.sponsor_impressions
for all
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- POLICIES: PUBLIC READ
-- =========================================================

drop policy if exists "sponsors_select_public_active" on public.sponsors;
create policy "sponsors_select_public_active"
on public.sponsors
for select
using (active = true);

drop policy if exists "overlays_select_public" on public.overlays;
create policy "overlays_select_public"
on public.overlays
for select
using (is_public = true);

drop policy if exists "app_settings_select_public" on public.app_settings;
create policy "app_settings_select_public"
on public.app_settings
for select
using (key = 'sponsor_settings');

-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists idx_sponsors_active on public.sponsors (active);
create index if not exists idx_sponsors_kind on public.sponsors (kind);
create index if not exists idx_overlays_public_id on public.overlays (public_id);
create index if not exists idx_telao_sessions_started on public.telao_sessions (started_at);
create index if not exists idx_telao_sessions_ended on public.telao_sessions (ended_at);
create index if not exists idx_sponsor_impressions_sponsor_id on public.sponsor_impressions (sponsor_id);
create index if not exists idx_sponsor_impressions_displayed_at on public.sponsor_impressions (displayed_at desc);

-- =========================================================
-- PUBLIC VIEW
-- =========================================================

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

revoke all on public.public_stats from public;
revoke all on public.public_stats from anon;
revoke all on public.public_stats from authenticated;

-- =========================================================
-- PUBLIC FUNCTIONS
-- =========================================================

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
  where s.active
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

drop function if exists public.create_admin_sponsor(text, public.sponsor_kind, text, public.media_type, text, integer, boolean);
create or replace function public.create_admin_sponsor(
  name_arg text,
  kind_arg public.sponsor_kind,
  media_url_arg text,
  media_type_arg public.media_type,
  website_url_arg text default null,
  duration_seconds_arg integer default 10,
  active_arg boolean default true
)
returns table (
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
)
language plpgsql
security definer
set search_path = public
as $$
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

grant execute on function public.create_admin_sponsor(text, public.sponsor_kind, text, public.media_type, text, integer, boolean) to authenticated;

drop function if exists public.update_admin_sponsor(uuid, text, public.sponsor_kind, text, public.media_type, text, integer, boolean);
create or replace function public.update_admin_sponsor(
  sponsor_id_arg uuid,
  name_arg text,
  kind_arg public.sponsor_kind,
  media_url_arg text,
  media_type_arg public.media_type,
  website_url_arg text default null,
  duration_seconds_arg integer default 10,
  active_arg boolean default true
)
returns table (
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
)
language plpgsql
security definer
set search_path = public
as $$
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

grant execute on function public.update_admin_sponsor(uuid, text, public.sponsor_kind, text, public.media_type, text, integer, boolean) to authenticated;

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

-- =========================================================
-- STORAGE
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public
)
values (
  'pascom-media',
  'pascom-media',
  true
)
on conflict (id)
do update set public = true;

drop policy if exists "pascom_media_public_read" on storage.objects;
create policy "pascom_media_public_read"
on storage.objects
for select
using (bucket_id = 'pascom-media');

drop policy if exists "pascom_media_admin_write" on storage.objects;
create policy "pascom_media_admin_write"
on storage.objects
for all
using (
  bucket_id = 'pascom-media'
  and public.is_admin()
)
with check (
  bucket_id = 'pascom-media'
  and public.is_admin()
);

drop policy if exists "pascom_media_admin_delete" on storage.objects;
create policy "pascom_media_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pascom-media'
  and public.is_admin()
);


