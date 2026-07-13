# Smoke test pós-deploy

Depois de publicar a aplicação, valide os pontos abaixo em ordem rápida:

1. Acessar `/` ou `/login` e confirmar que a interface carrega sem erro de renderização.
2. Confirmar `/painel-telao` e `/configuracoes` abrem com dados do Supabase carregados.
3. Abrir `/telao` e `/telao-master` e verificar se ao menos um patrocinador ativo aparece.
4. Solicitar `/api/anunciantes` e `/api/ads-novenario` para validar a resposta JSON.
5. Confirmar que a rota `/api/anunciantes/logs` aceita um payload simples e responde `200` ou `400` com mensagem clara.
6. Verificar se uploads para o bucket `pascom-media` funcionam para um arquivo de teste pequeno.
