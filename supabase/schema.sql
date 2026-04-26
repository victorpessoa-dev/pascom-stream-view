-- =========================================================
-- PASCOM STREAM VIEW - SUPABASE SCHEMA (AJUSTADO)
-- =========================================================

-- =========================================================
-- EXTENSIONS
-- =========================================================
create extension if not exists "pgcrypto";

-- =========================================================
-- TYPES (PADRONIZAÇÃO)
-- =========================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'sponsor_kind') then
    create type sponsor_kind as enum ('NORMAL', 'MASTER');
  end if;
end$$;

-- =========================================================
-- HELPERS / FUNÇÕES AUXILIARES
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Atualização automática de updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- TABELAS
-- =========================================================

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sponsors
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind sponsor_kind not null default 'NORMAL',
  image_url text,
  website_url text,
  duration_seconds integer not null default 10,
  active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint sponsors_duration_positive check (duration_seconds > 0)
);

-- Overlays
create table if not exists public.overlays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  width integer not null default 1920,
  height integer not null default 1080,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint overlays_size_positive check (width > 0 and height > 0)
);

-- Sessões do telão
create table if not exists public.telao_sessions (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  ended_at timestamptz,
  ads_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),

  constraint telao_sessions_ended_after_started
  check (ended_at is null or ended_at >= started_at)
);

-- =========================================================
-- TRIGGERS
-- =========================================================

-- updated_at automático (overlays)
drop trigger if exists update_overlays_updated_at on public.overlays;

create trigger update_overlays_updated_at
before update on public.overlays
for each row execute procedure public.update_updated_at();

-- Auto criar profile ao registrar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================================================
-- RLS (ROW LEVEL SECURITY)
-- =========================================================

alter table public.profiles enable row level security;
alter table public.sponsors enable row level security;
alter table public.overlays enable row level security;
alter table public.telao_sessions enable row level security;

-- =========================================================
-- POLICIES - PROFILES
-- =========================================================

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- =========================================================
-- POLICIES - ADMIN
-- =========================================================

create policy "sponsors_admin_full"
on public.sponsors
for all
using (public.is_admin())
with check (public.is_admin());

create policy "overlays_admin_full"
on public.overlays
for all
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- POLICIES - TELÃO (PÚBLICO CONTROLADO)
-- =========================================================

-- Criar sessão
create policy "telao_insert_public"
on public.telao_sessions
for insert
with check (true);

-- Finalizar sessão (apenas uma vez)
create policy "telao_end_session"
on public.telao_sessions
for update
using (ended_at is null)
with check (
  ended_at is not null
  and ended_at >= started_at
);

-- =========================================================
-- INDEXES (PERFORMANCE)
-- =========================================================

create index if not exists idx_sponsors_active
on public.sponsors (active);

create index if not exists idx_telao_sessions_started
on public.telao_sessions (started_at);

create index if not exists idx_telao_sessions_ended
on public.telao_sessions (ended_at);

-- =========================================================
-- VIEWS
-- =========================================================

create or replace view public.public_stats as
select
  (select count(*)::int from public.telao_sessions) as telao_total_views,

  (select coalesce(
    sum(extract(epoch from (ts.ended_at - ts.started_at))), 0
  )::int
   from public.telao_sessions ts
   where ts.ended_at is not null) as telao_total_seconds,

  (select count(*)::int from public.sponsors) as sponsors_total,
  (select count(*)::int from public.sponsors where active) as sponsors_active,
  (select count(*)::int from public.overlays) as overlays_total,

  now() as updated_at;

-- =========================================================
-- FUNÇÕES PÚBLICAS (API SAFE)
-- =========================================================

create or replace function public.get_public_stats()
returns table (
  telao_total_views integer,
  telao_total_seconds integer,
  sponsors_total integer,
  sponsors_active integer,
  overlays_total integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select * from public.public_stats;
$$;

grant execute on function public.get_public_stats()
to anon, authenticated;

create or replace function public.get_public_sponsors()
returns table (
  id uuid,
  name text,
  kind sponsor_kind,
  image_url text,
  website_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, s.kind, s.image_url, s.website_url
  from public.sponsors s
  where s.active
  order by
    case when s.kind = 'MASTER' then 0 else 1 end,
    s.created_at desc;
$$;

grant execute on function public.get_public_sponsors()
to anon, authenticated;