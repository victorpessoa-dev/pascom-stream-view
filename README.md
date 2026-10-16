# Virtus PlayCast

Virtus PlayCast e uma aplicacao Next.js para equipes de comunicacao paroquial gerenciarem patrocinadores, telao publico, overlays de transmissao e relatorios de exibicao.

O projeto usa Next.js App Router, Supabase Auth/Postgres/Storage, RLS, RPCs publicas controladas, Recharts, Radix UI e Tailwind CSS.

## Como Funciona

- O administrador acessa `/login` e entra no painel protegido.
- Patrocinadores sao cadastrados em `/painel-telao` com imagem, GIF ou video.
- O conteudo ativo aparece em `/ads-telao` ou `/{slug}/ads-telao`.
- O contador de exibicoes pode ser ativado por tipo de telao: NORMAL e MASTER.
- A pagina publica `/` lista patrocinadores, mostra estatisticas e direciona para relatorios.
- Cada patrocinador tem relatorio publico em `/{slug}/anunciantes/:id`.
- Overlays sao criados em `/overlay`, editados em `/editor/:id` e exibidos por `/{slug}/shared/:id`.

## Documentacao

Comece por [docs/projeto-como-funciona.md](docs/projeto-como-funciona.md).

Indice completo: [docs/README.md](docs/README.md).

## Variaveis Principais

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=
PROVISIONING_API_KEY=
```

As variáveis `NEXT_PUBLIC_*` podem ser expostas ao cliente. `SUPABASE_SERVICE_ROLE_KEY` e `PROVISIONING_API_KEY` são exclusivas do servidor e não podem ser versionadas ou usadas em componentes de cliente. `NEXT_PUBLIC_SITE_URL` define o destino do convite por email.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

## Docker

Defina `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em um arquivo `.env` e inicie a aplicação com:

```bash
docker compose up --build
```

A aplicação ficará disponível em `http://localhost:3000`. O Compose verifica periodicamente se a rota inicial responde antes de marcar o container como saudável.

## Validacao Recomendada

Antes de publicar:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

No Windows, em alguns ambientes sandbox, Vitest/Next podem falhar com `spawn EPERM` ao iniciar workers. Rode fora do sandbox quando isso acontecer.

## Midia

- Imagens JPEG/PNG/WebP sao otimizadas para WebP antes do upload.
- GIF e preservado.
- Videos aceitos: MP4 e WebM.
- Limite atual de upload: 100 MB.

## Seguranca

- Admin bloqueado em mobile.
- Rotas administrativas protegidas por Supabase Auth e verificacao de `profiles.is_admin`.
- Escritas protegidas por RLS com `public.is_admin()`.
- APIs publicas usam RPCs e respostas `no-store`.
- Links publicos sao filtrados para `http/https`.
