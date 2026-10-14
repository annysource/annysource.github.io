# Portfolio Jekyll — Anny Caroline Sousa

Três layouts com a mesma identidade: início editorial, coleção de projetos e biblioteca com índice lateral. Fundo claro, corpo de texto profissional, títulos Architects Daughter e Caderno com quadriculado discreto.

## Executar
Abra o terminal nesta pasta:
```powershell
bundle install
bundle exec jekyll serve
```
Acesse http://localhost:4000. Para conferir a publicação: `bundle exec jekyll build`.

## Editar
- `index.html`: início.
- `_projects/*.md`: casos. Os três atuais são pontos de partida com informações que você relatou e comentários para completar.
- `pesquisa/index.md`, `acervo/index.md`, `sobre/index.md`: textos e registros.
- `_data/navigation.yml`: menu.
- `assets/style.css`: cores, fontes e responsividade.
- `_config.yml`: newsletter_url, portrait, email, cv_url e domínio.
- `en/index.md` e `es/index.md`: apresentações traduzidas. Os demais conteúdos continuam em português.

## Adicionar projeto
Crie `_projects/nome.md`:
```yaml
---
title: Nome do projeto
role: Sua contribuição
organization: Instituição
area: Games & XR
category: qa
featured: false
order: 4
cover: /assets/images/nome.jpg
cover_alt: Descrição da imagem
cover_position: center
cover_fit: cover
---
```
Escreva abaixo contexto, contribuição, resultados e links. Categorias do filtro: qa, autoria, pesquisa. Remova cover até possuir imagem; o cartão mostra uma área neutra. Coloque fotos em `assets/images/`. Use `cover_position` para ajustar o enquadramento (por exemplo, `center top`) e `cover_fit: contain` para exibir a imagem inteira.

## Publicar no Caderno
Crie `_posts/AAAA-MM-DD-titulo.md`, com:
```yaml
---
layout: post
title: Título da edição
---
```
Escreva o conteúdo em Markdown. Ele aparece no Caderno e no feed RSS. O link de assinatura aparece quando newsletter_url tiver valor. Isso permite manter a newsletter em um serviço externo; o Jekyll não envia emails.

## GitHub Pages
Suba o conteúdo desta pasta na raiz do repositório. Em Settings > Pages, escolha GitHub Actions. O workflow já está em .github/workflows/pages.yml.
Preencha url com https://seu-dominio.dev, sem barra final. Em repositório de projeto sem domínio, configure também baseurl conforme o endereço. Configure o domínio no GitHub e no DNS quando adquirido; nenhum CNAME foi inventado.

Títulos, descrições, HTML semântico, sitemap e feed estão preparados. Complete os casos e configure a URL antes de publicar. SEO depende também da qualidade e das evidências do conteúdo.

## Qualidade
Layouts flexíveis para celular, desktop e ultrawide; linhas de leitura limitadas; navegação por teclado, foco visível e filtros com anúncio acessível. Sem JavaScript, todos os projetos e links do menu continuam disponíveis. O tema permanece claro independentemente do sistema.

Three.js pode ser adicionado como experiência opcional sem impedir leitura; não há dependência 3D nesta versão.


## Verificação desta implementação
A integração foi testada em Chromium 151, com prévia gerada a partir dos templates usando LiquidJS e Markdown, inclusive com baseurl /portfolio. Foram conferidas larguras de 360 a 2560 px, toque em dispositivo emulado, teclado, pausa, temas, evolução, colisões, ponteiro e galerias. O build real do Jekyll continua pendente porque o Ruby não inicia no ambiente de ferramentas. A pasta _site existente pode conter uma versão anterior até você executar o build.

## Fotos e encontros
Use o rascunho _drafts/encontro.md como modelo. Coloque fotos reais em assets/images e preencha gallery com src, alt, caption e, opcionalmente, width/height. A galeria aparece após o texto do post. Marque featured: true nas fotos que também devem aparecer em Encontros & bastidores no Acervo. Sem JavaScript, os links continuam abrindo as imagens; com JavaScript, há ampliação, setas e Escape.

## Joaninhas no rodapé
Os arquivos de jogo foram copiados para assets/joaninhas. A integração está em _includes/footer-game.html e assets/footer-game.js. O jogo fica numa seção opcional recolhida, inicia em cinza chumbo e só roda quando a pessoa começa a jogar. O iframe ajusta sua altura aos controles. O ponteiro.js também é carregado pela página hospedeira. As URLs usam relative_url, incluindo em repositórios com baseurl.

## Bora marcar?
A interface publicada fica em `bora-marcar/`. O Worker e os testes ficam em `worker/` e `tests/`; `wrangler.jsonc` e os arquivos npm ficam na raiz. O Jekyll exclui esses arquivos de `_site`.

- `npm test`: executa os testes do app e do Worker.
- `npm run preview`: serve a interface localmente em `http://127.0.0.1:4173`.
- `bora-marcar/config.js`: contém somente a URL pública da API. Para uma demonstração local sem sincronização, deixe `apiUrl` vazio; restaure a URL do Worker antes de publicar.
- Para publicar a API pela primeira vez, instale as dependências com `npm install`, autentique com `npx wrangler login`, execute `npm run api:deploy` e depois configure `CREATE_KEY` com `npx wrangler secret put CREATE_KEY`. Não coloque essa chave em `config.js`.

A API permite criação apenas com `CREATE_KEY`, protege alterações de votos com PIN e restringe a origem em `wrangler.jsonc`. CORS não substitui autorização. O PIN protege edições depois do primeiro voto, mas não confirma a identidade na primeira resposta. Teste em dois dispositivos antes de usar com um grupo; `npm test` não valida uma implantação real do Cloudflare.
