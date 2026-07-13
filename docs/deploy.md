# Deploy, Ambientes e Operacao

## Variaveis

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

As duas variaveis sao obrigatorias no client e no server.

## Vercel

```mermaid
flowchart TD
  A[Push Git] --> B[Vercel]
  B --> C[npm ci]
  C --> D[npm run build]
  D --> E[Deploy]
  E --> F[Smoke test]
```

Passos:

1. Configurar variaveis Supabase.
2. Aplicar migrations no Supabase.
3. Garantir usuario admin em `profiles`.
4. Rodar localmente `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build`.
5. Publicar.
6. Fazer smoke test.

## Node

```bash
npm ci
npm run build
npm run start
```

Use process manager externo para manter restart automatico.

## Supabase

Setup esperado:

- Auth habilitado.
- Migrations aplicadas.
- RLS ativo.
- RPCs criadas.
- Bucket `pascom-media`.
- Policies de storage aplicadas.

## Backup e Restore

Backup:

- exportar banco Supabase;
- guardar arquivos do bucket `pascom-media`;
- guardar variaveis de ambiente fora do repositorio;
- documentar versao/commit em producao.

Restore:

1. Restaurar banco.
2. Restaurar bucket.
3. Reaplicar variaveis.
4. Rodar migrations pendentes.
5. Fazer smoke test.

## Smoke Test

- `/` carrega perfil e patrocinadores.
- `/login` abre e redireciona depois de login.
- `/admin` exige admin.
- `/painel-telao` lista patrocinadores.
- `/telao` e `/telao-master` exibem midia ativa.
- `/overlay` lista overlays.
- `/shared/:id` abre overlay publico.
