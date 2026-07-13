# Banco de Dados

## Objetivo

Documentar tabelas, relacionamentos, constraints, indices, migrations, seeds, RLS e fluxo de acesso.

## Tabelas

- `profiles`: perfil do usuario Supabase, com `is_admin`.
- `sponsors`: patrocinadores/anunciantes, midia, duracao, status e metricas.
- `overlays`: overlays com `public_id`, dimensoes e `data.elements`.
- `app_settings`: configuracoes JSON por chave.
- `telao_sessions`: sessoes historicas do telao.
- `sponsor_impressions`: logs de exibicao por patrocinador.

## ER

```mermaid
erDiagram
  profiles {
    uuid id PK
    text display_name
    boolean is_admin
    timestamptz created_at
  }
  sponsors {
    uuid id PK
    sponsor_kind kind
    media_type media_type
    integer views
    integer total_seconds
  }
  overlays {
    uuid id PK
    text public_id UK
    jsonb data
    boolean is_public
  }
  app_settings {
    text key PK
    jsonb value
  }
  telao_sessions {
    uuid id PK
    timestamptz started_at
    timestamptz ended_at
  }
  sponsor_impressions {
    uuid id PK
    uuid sponsor_id FK
    integer duration_seconds
  }
  sponsors ||--o{ sponsor_impressions : receives
```

## Constraints e Indices

- Checks de nome nao vazio, duracao positiva e dimensoes positivas.
- `overlays.public_id` unico.
- Indices em `sponsors.active`, `sponsors.kind`, `overlays.public_id`, sessoes e impressions.

## RPCs

- `get_public_stats`
- `get_public_sponsors`
- `get_public_sponsor_directory`
- `get_public_overlay`
- `get_sponsor_settings`
- `log_sponsor_impression`
- `record_sponsor_view`
- `get_public_sponsor_detail`
- `get_public_sponsor_impressions`

## RLS

```mermaid
flowchart TD
  A[Requisicao] --> B{Tabela}
  B --> C[profiles: proprio usuario]
  B --> D[sponsors/overlays/settings: admin full]
  B --> E[public read: sponsors active, overlays public, sponsor_settings]
  D --> F[public.is_admin]
  F --> G[profiles.is_admin pelo auth.uid]
```

## Limitacoes

- RPCs `security definer` devem ser revisadas periodicamente.
- Operacoes administrativas via browser dependem de RLS, sem camada server-side propria.
- `schema.sql` e migrations devem permanecer sincronizados.
