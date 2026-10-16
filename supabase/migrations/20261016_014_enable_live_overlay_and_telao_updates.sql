-- Send database changes to currently open overlays and telões.
-- Each block is idempotent because Supabase may already publish the table.
do $$ begin
  alter publication supabase_realtime add table public.overlays;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.sponsors;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.app_settings;
exception when duplicate_object then null; end $$;
