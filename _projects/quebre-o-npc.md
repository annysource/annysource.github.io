---
title: "Quebre o NPC — laboratório de QA para NPCs com IA"
role: "Concepção, desenvolvimento e testes"
organization: "Projeto independente · material de palestra"
area: "QA de IA generativa · Aplicação Web"
category: qa
featured: false
order: 2
home_featured: false
project_stage: "Interface e Worker implementados; testes automatizados do Worker com IA simulada. Implantação com IA real pendente de ensaio."
problem: "Testar um NPC que gera as próprias falas exige repetir tentativas e julgar comportamentos, não comparar frases. Estudantes raramente têm uma ferramenta simples para praticar isso."
contribution: "Criei uma ferramenta web em que duplas conversam com NPCs movidos por IA, tentam quebrá-los em seis missões de teste e registram notas e taxas de falha."
evidence_summary: "Suíte Node.js com 5 testes do Worker: código da turma, origem, validação da conversa, dois provedores de IA, erros e limite por computador."
summary: "Laboratório de QA em que estudantes testam NPCs com LLM, como o guarda Bartô e um surucuá da serra de Miguel Pereira, e medem quantas vezes cada um quebra."
technologies: ["HTML", "CSS", "JavaScript", "Cloudflare Workers", "API Gemini / Claude", "Node.js test runner"]
demo_url: /quebre-o-npc/
repository_url: "https://github.com/annysource/annysource.github.io"
---

## Problema

Um NPC com LLM não tem uma resposta esperada fixa: a mesma pergunta gera falas diferentes. Por isso, um teste que passou uma vez não prova nada, e um defeito precisa ser descrito com a frequência em que aparece. Criei esta ferramenta para uma palestra a estudantes de Jogos Digitais, a partir da minha experiência como QA Lead em um jogo VR com personagens movidos por IA.

## Solução implementada

A dupla escolhe um NPC e uma das seis missões: suborno e pressão, promessa falsa, quebra de personagem, vazamento de segredo, papo fora do mundo do jogo e consistência. Cada tentativa é uma conversa nova. Ao final, a dupla dá nota 1, 0,5 ou 0 contra o critério da missão, e a ficha calcula em quantas tentativas o NPC quebrou.

Os NPCs são o Bartô, guarda de portão que guarda uma senha, e um surucuá-de-barriga-amarela que protege a localização do ninho, como fazem observadores de aves de verdade. O prompt de cada NPC fica visível e editável; cada nota registra se o prompt era o original ou uma versão editada.

## Arquitetura e fluxo técnico

- Interface estática em `quebre-o-npc/`, sem frameworks, para rodar em computadores de laboratório.
- A interface envia o prompt e a conversa para um Cloudflare Worker.
- O Worker guarda a chave da IA como segredo, confere o código da turma e a origem, valida a conversa e limita pedidos por computador.
- O Worker conversa com o Gemini, pelo endpoint compatível com OpenAI, ou com a API do Claude.
- A ficha da dupla fica no navegador e pode ser exportada em CSV.

## Decisões técnicas

A chave da IA nunca vai para a página pública; o código da turma impede que o Worker seja usado fora da aula. Os prompts são de propósito comuns, não blindados, para que a turma encontre falhas reais. O Worker devolve mensagens de erro em linguagem simples, pensadas para estudantes.

## Testes e evidências

`npm test` executa, entre outros, 5 testes do Worker com o provedor de IA simulado: código da turma incorreto, origem não autorizada, conversa malformada, formato das chamadas ao Gemini e ao Claude, erro de limite do provedor, resposta vazia e limite de 20 pedidos por minuto por computador. A interface foi testada em Chromium contra um Worker local com IA simulada. O uso com uma IA real depende da configuração do Worker e não é afirmado por este relato.

[Abrir a aplicação]({{ '/quebre-o-npc/' | relative_url }}) · [Ver o repositório no GitHub](https://github.com/annysource/annysource.github.io)
