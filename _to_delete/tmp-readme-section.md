
## Quebre o NPC
Laboratório de QA para NPCs com IA, usado na palestra sobre testes de NPCs com LLM. A interface publicada fica em `quebre-o-npc/`; a página do projeto em `_projects/quebre-o-npc.md`. O Worker fica em `worker/quebre-o-npc.js` e os testes em `tests/quebre-o-npc.test.js` (ambos fora do `_site`).

- `quebre-o-npc/npcs.js`: prompts do Bartô e do Surucuá e as 6 missões.
- `quebre-o-npc/config.js`: somente a URL pública do Worker (`https://quebre-o-npc.sousa-annyc.workers.dev/chat`). Nunca coloque a chave da IA aqui.
- O Worker é publicado pelo painel do Cloudflare (colar o código), não pelo `wrangler.jsonc`, que continua sendo do Bora marcar.
- Variáveis do Worker: `API_KEY` (secret), `CLASS_CODE` (secret), `PROVIDER` (`gemini` ou `anthropic`), `ALLOWED_ORIGINS` (`https://annysousa.dev`), `MODEL` (opcional).
- Depois da aula, troque o `CLASS_CODE` ou apague a `API_KEY`.
- `npm test` cobre o Worker com a IA simulada; não valida a IA real nem a implantação.
