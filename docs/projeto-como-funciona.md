# O Que E o Projeto e Como Funciona

## Ideia do Projeto

PASCOM Stream View e uma ferramenta operacional para a PASCOM organizar patrocinadores e elementos visuais usados em transmissao. A ideia e ter um painel simples para a equipe cadastrar midias, controlar o que aparece no telao, acompanhar exibicoes e disponibilizar transparencia publica para patrocinadores e comunidade.

O sistema nao e uma landing page. Ele e uma aplicacao de operacao: painel administrativo, telao publico, telao master, editor de overlays e relatorios.

## Publicos

- Operador da PASCOM: cadastra patrocinadores, ativa/desativa midias, abre os teloes e acompanha metricas.
- Equipe de transmissao: usa overlays em OBS ou ferramenta equivalente por meio de links publicos.
- Patrocinador: consulta pagina publica com historico e relatorio de exibicoes.
- Comunidade: ve a pagina publica com patrocinadores e dados principais.

## Fluxo Principal

```mermaid
flowchart TD
  A[Admin faz login] --> B[Painel administrativo]
  B --> C[Cadastra patrocinadores]
  C --> D[Ativa NORMAL ou MASTER]
  D --> E[/telao e /telao-master exibem a playlist]
  E --> F[Player registra exibicoes quando contador esta ativo]
  F --> G[Relatorios publicos por patrocinador]
  B --> H[Cria overlays]
  H --> I[/shared/:id usado na transmissao]
```

## Modulos Visiveis

- `/`: pagina publica com identidade da paroquia, preview do telao, cards de patrocinadores e estatisticas.
- `/login`: entrada administrativa.
- `/admin`: dashboard operacional.
- `/painel-telao`: cadastro, edicao, upload, ativacao e contador de patrocinadores.
- `/telao`: telao normal.
- `/telao-master`: telao master.
- `/anunciantes/:id`: relatorio publico de um patrocinador.
- `/overlay`: lista de overlays.
- `/editor/:id`: editor visual de overlay.
- `/shared/:id`: overlay publico para uso em transmissao.

## Contador de Exibicoes

O contador pode ser ligado no painel do telao. Ele respeita as telas NORMAL e MASTER separadamente:

- NORMAL conta exibicoes de `/telao`.
- MASTER conta exibicoes de `/telao-master`.
- Se um tipo nao possui patrocinador ativo, ele fica indisponivel para contagem.
- Se os dois tipos estiverem pausados ou sem patrocinadores ativos, o contador global desativa.
- O player guarda uma fila local de logs quando fica offline e tenta reenviar depois.

## Midias

Patrocinadores aceitam imagem, GIF, MP4 e WebM. Imagens comuns sao otimizadas antes do upload. Videos e GIFs podem aparecer como preview estatico em areas administrativas/publicas para evitar movimento excessivo, mas rodam no telao quando configurados como midia do patrocinador.

## Dados e Seguranca

O banco e Supabase Postgres. O app usa:

- Supabase Auth para login.
- `profiles.is_admin` para autorizar painel.
- RLS para proteger escrita.
- RPCs `security definer` para consultas publicas controladas.
- Supabase Storage no bucket `pascom-media`.
- Headers de seguranca no Next.
- Validacao de URLs publicas para aceitar apenas `http` e `https`.

## Cache e Atualizacao

As APIs publicas retornam `Cache-Control: no-store` para evitar dados velhos. O telao usa realtime do Supabase para reagir a mudancas no banco, e tambem mantem cache local para continuar exibindo a ultima playlist quando estiver offline.
