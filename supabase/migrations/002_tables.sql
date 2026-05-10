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

create index if not exists idx_sponsors_active on public.sponsors (active);
create index if not exists idx_sponsors_kind on public.sponsors (kind);
create index if not exists idx_overlays_public_id on public.overlays (public_id);
create index if not exists idx_telao_sessions_started on public.telao_sessions (started_at);
create index if not exists idx_telao_sessions_ended on public.telao_sessions (ended_at);
create index if not exists idx_sponsor_impressions_sponsor_id on public.sponsor_impressions (sponsor_id);
create index if not exists idx_sponsor_impressions_displayed_at on public.sponsor_impressions (displayed_at desc);
