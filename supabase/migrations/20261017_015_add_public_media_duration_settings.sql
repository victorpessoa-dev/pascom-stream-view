-- Expose the administrative media durations to public telões. Keeping the
-- durations in the live sponsor settings payload lets an open player apply a
-- configuration change immediately without rewriting every sponsor record.
create or replace function public.get_sponsor_settings(church_id_arg uuid) returns jsonb language sql stable security definer
set search_path = public as $$
  select coalesce(
    (select value from public.app_settings
      where church_id = church_id_arg
        and key = 'sponsor_settings'
        and public.is_public_church(church_id)),
    '{}'::jsonb
  ) || jsonb_build_object(
    'mediaDurations',
    jsonb_build_object(
      'image', greatest(3, coalesce(
        nullif((select value #>> '{telao,defaultDurationImage}' from public.app_settings
          where church_id = church_id_arg and key = 'admin_settings'), '')::integer,
        nullif((select value #>> '{telao,defaultDurationNormal}' from public.app_settings
          where church_id = church_id_arg and key = 'admin_settings'), '')::integer,
        10
      )),
      'video', greatest(3, coalesce(
        nullif((select value #>> '{telao,defaultDurationVideo}' from public.app_settings
          where church_id = church_id_arg and key = 'admin_settings'), '')::integer,
        nullif((select value #>> '{telao,defaultDurationMaster}' from public.app_settings
          where church_id = church_id_arg and key = 'admin_settings'), '')::integer,
        15
      ))
    )
  )
$$;
