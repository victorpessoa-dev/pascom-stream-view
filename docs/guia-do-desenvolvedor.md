# Guia do Desenvolvedor

## Setup

```bash
npm install
npm run dev
```

Variaveis:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Rotina de Qualidade

Antes de concluir uma alteracao:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Padroes

- Use `rg` para buscas.
- Mantenha regras de negocio em `lib/services` quando possivel.
- Mantenha acesso Supabase em `lib/repositories`.
- Use mappers para converter nomes de banco para formato de UI.
- Use `lib/utils` para helpers puros e testaveis.
- Evite adicionar logica grande dentro de componentes ja extensos.
- Atualize docs junto com migrations, rotas e regras de negocio.

## Fluxo de Desenvolvimento

```mermaid
flowchart TD
  A[Entender dominio] --> B[Alteracao pequena]
  B --> C[Teste ou validacao]
  C --> D[Docs se necessario]
  D --> E[Lint/typecheck/test/build]
```

## Supabase

Ao alterar banco:

- criar migration nova;
- atualizar `supabase/schema.sql`;
- revisar RLS/RPCs;
- documentar em `docs/banco-de-dados.md` ou `docs/seguranca-operacao.md`.

## UI

- Admin e operacional, nao marketing.
- Evite cards dentro de cards.
- Garanta `min-w-0` em grids com graficos/tabelas.
- Admin abaixo de `md` deve exibir bloqueio mobile.
- Midia animada em cards pode usar `StaticMediaFrame`.
