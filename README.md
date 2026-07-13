# PASCOM Stream View

Aplicacao Next.js para gerenciamento de patrocinadores, telao publico e overlays de transmissao da PASCOM.

Esta auditoria inicial esta documentada em [docs/README.md](docs/README.md).

## Variaveis principais

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
REDIS_URL=
REDIS_CACHE_PREFIX=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REDIS_REST_URL=
REDIS_REST_TOKEN=
```

Redis e opcional. Quando configurado por `REDIS_URL`, `UPSTASH_REDIS_REST_*` ou `REDIS_REST_*`, as APIs publicas usam cache por TTL curto.
Use `REDIS_CACHE_PREFIX` para isolar as chaves do projeto dentro de um Redis compartilhado.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run redis:dataset
```

## Estado da auditoria

- Build de producao validado com `npm run build`.
- Lint executa limpo com `eslint.config.mjs`.
- Typecheck direto executa limpo com `npm run typecheck`.
- Build executa TypeScript; `typescript.ignoreBuildErrors` foi removido.
- Testes automatizados foram iniciados com Vitest.
- O root do Turbopack foi fixado em `next.config.mjs`.
- O projeto foi padronizado para npm; `pnpm-lock.yaml` foi removido.
- A refatoracao arquitetural foi iniciada com mappers centralizados e hardening de APIs.
- Upload de imagens otimiza JPEG/PNG/WebP para WebP antes de salvar.
- Upload de videos aceita WebM ou MP4; WebM tende a ser menor, MP4 e o fallback mais compativel.
