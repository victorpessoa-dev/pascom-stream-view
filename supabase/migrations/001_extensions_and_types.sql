create extension if not exists "pgcrypto";

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
