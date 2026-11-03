---
title: "QA Test Case Recommender — IA aplicada à recomendação de testes"
card_title: "QA Test Case Recommender"
summary: "Recomendação de testes de regressão a partir do contexto de Pull Requests em jogos."
role: "Desenvolvimento do recomendador e aplicação experimental ao GaloZica"
organization: "Projeto independente desenvolvido durante especialização em Engenharia de Software com IA Aplicada"
period: "Experimento aplicado ao GaloZica durante a Women Game Jam 2026"
area: "Engenharia de Software · IA Aplicada · Game Development"
category: qa
featured: true
order: 7
home_featured: true
home_order: 7
video_previews: true
problem: "Em jogos com desenvolvimento contínuo, selecionar manualmente os testes de regressão relevantes para cada Pull Request se torna mais trabalhoso conforme o projeto cresce."
contribution: "Desenvolvi o recomendador, adaptei o modelo ao contexto de QA de jogos e apliquei o experimento ao GaloZica."
evidence_summary: "Repositórios, artigo técnico, registro do workflow e gameplay do GaloZica."
technologies: ["TensorFlow.js", "JavaScript", "Node.js", "GitHub Actions", "JSON", "Unity e C# (GaloZica)"]
home_context: "TensorFlow.js · JavaScript · Node.js · GitHub Actions · regressão · Game QA"
project_stage: "Protótipo funcional e experimento aplicado ao GaloZica; não apresentado como solução de produção."
cover: /assets/images/qa-test-case-recommender-cover.jpg
cover_alt: "Captura do GaloZica em jogo, protótipo usado no experimento"
repository_url: "https://github.com/annysource/neural-qa-test-recommender"
evidence_url: "https://www.linkedin.com/pulse/patch-notes-de-portf%C3%B3lio-007-pr-e-checklist-regress%C3%A3o-sousa-ljikf/"
evidence_label: "Artigo técnico"
---

## Contexto e problema

Em jogos que recebem alterações frequentes, uma mudança localizada pode afetar comportamentos existentes. À medida que o projeto e seu catálogo de testes crescem, escolher manualmente o que revisar em cada Pull Request exige mais análise.

O experimento investiga como usar o contexto de uma alteração para apoiar a seleção de testes de regressão durante a revisão de código. A ferramenta não detecta bugs: ela ordena casos de teste já cadastrados para apoiar a análise de QA.

## Solução desenvolvida

O QA Test Case Recommender é um protótipo funcional em JavaScript e TensorFlow.js. Ele usa informações do Pull Request e um catálogo de casos de teste para calcular uma ordenação de recomendações. Cada caso pode incluir justificativa, passos, cenário Gherkin e resultado esperado.

O fluxo implementado:

1. Lê branch, título, descrição, mensagens dos commits e arquivos alterados no Pull Request.
2. Relaciona esse contexto ao catálogo de casos de teste e ao histórico versionado.
3. Usa o serviço compartilhado de recomendação, com modelo TensorFlow.js, para calcular scores.
4. Ordena os casos mais relacionados à alteração.
5. Monta uma checklist com os dados já associados a cada caso, incluindo seus cenários Gherkin.
6. Publica ou atualiza um comentário no Pull Request com as recomendações.

Os cenários Gherkin são recuperados do catálogo; não são gerados automaticamente.

## Arquitetura técnica

<div class="qa-recommender-flow" role="group" aria-label="Fluxo técnico do recomendador">
  <p><strong>Entrada:</strong> Pull Request → GitHub Actions → <code>scripts/recommend-pr.js</code></p>
  <p><strong>Dados e modelo:</strong> <code>data/test-cases.json</code> + <code>data/change-history.json</code> → <code>src/service/RecommendationModel.js</code> → TensorFlow.js</p>
  <p><strong>Saída:</strong> casos ordenados → checklist em comentário no Pull Request</p>
</div>

- **Dados:** `data/test-cases.json` contém o catálogo; `data/change-history.json` fornece exemplos de contexto e seleções associadas.
- **Serviço de recomendação:** `src/service/RecommendationModel.js` prepara os dados, treina o modelo e calcula scores. A implementação usa uma rede densa com camadas `128 → 64 → 32 → 1`, ativações ReLU nas camadas intermediárias, sigmoid na saída e `binaryCrossentropy`.
- **Worker:** `src/workers/modelTrainingWorker.js` executa o treino e a recomendação fora do fluxo principal da interface da demonstração.
- **Demonstração local:** `src/controller/QAController.js` e `src/view/ChecklistView.js` organizam a interação no padrão MVC.
- **Integração com PRs:** `scripts/recommend-pr.js` reúne o contexto do Pull Request, chama o serviço compartilhado e escreve o comentário da checklist.

O ranking combina sinais do contexto textual, dos arquivos alterados, do histórico e do modelo. O score serve para ordenar as recomendações; não é uma probabilidade calibrada.

## Aplicação experimental: GaloZica

O recomendador foi aplicado ao GaloZica, protótipo de jogo desenvolvido durante a Women Game Jam 2026. A branch pública registra o código do jogo e a integração do experimento ao fluxo de Pull Requests.

Foram explorados dois contextos de alteração:

- Inclusão de novos itens coletáveis pelo personagem, relacionada à revisão de casos sobre interação e coleta de itens.
- Atualização da lista de áudios associados às quests, usada como contexto para revisar os casos pertinentes do catálogo.

Esses cenários mostram como os metadados e os arquivos alterados podem orientar a ordenação de verificações relacionadas. Não são evidência de que o recomendador executou os testes ou validou automaticamente o jogo. O protótipo jogável está disponível no [itch.io](https://annynaweb.itch.io/galo-zica).

## Integração com GitHub Actions

O workflow publicado é acionado em Pull Requests para `main` nos eventos `opened`, `synchronize` e `reopened`. Ele declara `contents: read`, `pull-requests: write` e `issues: write`, prepara Node.js 20, executa `npm ci` e chama `npm run recommend:pr`. O script consulta metadados, commits e arquivos do PR e cria ou atualiza o comentário de recomendações.

Há uma divergência importante entre a documentação e o YAML publicado: o README do recomendador menciona `pull_request_target` e checkout somente da branch base, mas os arquivos de workflow verificados usam `pull_request` e `actions/checkout@v4`, sem fixar a referência da branch base. Portanto, este case descreve o evento e os passos que estão no YAML; não afirma que o workflow executa apenas código da branch base ou que não instala dependências fornecidas pelo PR. A configuração e a documentação do repositório devem ser conferidas em conjunto antes de generalizar as garantias de execução ou suporte a PRs de forks.

## Dados e limitações

O artigo do experimento registra um conjunto de 73 casos de teste. O README do recomendador esclarece que os dados de demonstração versionados são ilustrativos e não representam o histórico real de QA do GaloZica; o uso operacional exigiria casos e histórico representativos do projeto.

- O score é um sinal de ordenação, não uma probabilidade de falha ou de cobertura.
- A pessoa responsável por QA revisa as recomendações e decide a cobertura.
- O workflow comenta os casos sugeridos; não executa automaticamente os testes recomendados.
- As respostas da checklist não são coletadas automaticamente para atualizar o histórico.
- Não são apresentados resultados de precisão, redução de bugs, produtividade ou uso em produção.

## Vídeos e demonstrações

<figure class="project-demo video-preview video-preview-wide" data-video-preview data-youtube-id="h0ZzwdKC1XE" data-video-title="QA Test Case Recommender — demonstração">
  <div class="video-preview-screen">
    <img src="{{ '/assets/images/qa-test-case-recommender-workflow.jpg' | relative_url }}" alt="Captura do workflow do recomendador no Pull Request" loading="lazy" decoding="async">
    <div class="video-preview-frame" data-video-frame hidden></div>
    <button class="video-preview-play" type="button" data-video-play>Reproduzir vídeo</button>
  </div>
  <a class="video-preview-link" href="https://youtu.be/h0ZzwdKC1XE" target="_blank" rel="noopener noreferrer">Assistir no YouTube ↗</a>
  <figcaption>Registro de uma execução do workflow em um Pull Request do GaloZica; a captura mostra os checks concluídos.</figcaption>
</figure>

<figure class="project-demo video-preview video-preview-wide" data-video-preview data-youtube-id="LaKX6hAxobU" data-video-title="GaloZica — protótipo jogável">
  <div class="video-preview-screen">
    <img src="{{ '/assets/images/qa-test-case-recommender-cover.jpg' | relative_url }}" alt="Captura do GaloZica em jogo" loading="lazy" decoding="async">
    <div class="video-preview-frame" data-video-frame hidden></div>
    <button class="video-preview-play" type="button" data-video-play>Reproduzir vídeo</button>
  </div>
  <a class="video-preview-link" href="https://youtu.be/LaKX6hAxobU" target="_blank" rel="noopener noreferrer">Assistir no YouTube ↗</a>
  <figcaption>Gameplay do GaloZica, projeto usado na aplicação experimental.</figcaption>
</figure>

## Tecnologias

- **Recomendador e integração:** JavaScript, Node.js, TensorFlow.js, GitHub Actions e dados JSON.
- **Qualidade:** testes automatizados do projeto em Node.js e revisão humana das recomendações.
- **Projeto de jogo:** Unity e C# no GaloZica. Essa tecnologia pertence ao jogo usado no experimento, não ao modelo de recomendação.

## Referências

- [Repositório QA Test Case Recommender](https://github.com/annysource/neural-qa-test-recommender)
- [GaloZica — branch com o recomendador](https://github.com/annysource/galozica_womengamejam2026/tree/feature/teste-recomendador-qa)
- [Artigo Patch Notes de Portfólio #007](https://www.linkedin.com/pulse/patch-notes-de-portf%C3%B3lio-007-pr-e-checklist-regress%C3%A3o-sousa-ljikf/)
- [Protótipo jogável do GaloZica](https://annynaweb.itch.io/galo-zica)
