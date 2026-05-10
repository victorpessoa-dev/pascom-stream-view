insert into public.app_settings (
  key,
  value
)
values (
  'sponsor_settings',
  '{
    "metricsEnabled": false,
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
