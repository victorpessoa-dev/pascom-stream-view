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


