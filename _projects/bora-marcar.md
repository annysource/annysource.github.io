---
title: "Bora marcar? — agenda do grupo"
role: "Concepção, desenvolvimento e testes"
organization: "Projeto independente"
area: "Engenharia de Software · Aplicação Web"
category: autoria
featured: true
order: 1
home_featured: true
home_order: 1
project_stage: "Aplicação implementada; testes locais automatizados disponíveis."
problem: "Organizar horários em grupos pode gerar muitas mensagens e dificultar a visualização da disponibilidade comum."
contribution: "Implementei uma aplicação web para criar votações de disponibilidade, compartilhar um link e visualizar os horários com maior quórum."
evidence_summary: "Suíte Node.js com 7 testes passando; inclui validação dos horários, votos, PIN, expiração e tabela semanal."
summary: "Aplicação web para organizar disponibilidade em grupo com criação de votações, respostas por link e cálculo de horários com maior quórum."
technologies: ["HTML", "CSS", "JavaScript (ES modules)", "Cloudflare Workers", "Durable Objects", "Node.js test runner"]
demo_url: /bora-marcar/
repository_url: "https://github.com/annysource/annysource.github.io"
---

## Problema

Combinar uma data em uma conversa de grupo pode espalhar respostas e dificultar a comparação dos horários disponíveis. A proposta foi tornar a coleta e a leitura dessas disponibilidades mais simples, sem escolher o encontro pelo grupo.

## Solução implementada

O organizador cria uma votação com período, convidados e horários. Cada pessoa informa sua disponibilidade; a aplicação calcula e apresenta os horários com maior quórum para que o grupo combine a decisão final.

A interface também permite compartilhar o convite, registrar respostas e editar uma resposta com o PIN criado na primeira participação. Quando a API não está configurada, há um modo de demonstração local com dados armazenados no navegador.

## Arquitetura e fluxo técnico

- Interface em HTML, CSS e módulos JavaScript, servida em `bora-marcar/`.
- Regras de domínio e geração da tabela semanal separadas em `domain.js` e `schedule.js`.
- A interface envia requisições JSON para um Cloudflare Worker.
- O Worker encaminha cada reunião a um Durable Object, que mantém os dados e agenda sua expiração.
- A chave de criação é lida pelo Worker a partir da configuração de ambiente; não fica na configuração pública da interface.

## Decisões técnicas

As regras de disponibilidade, validação e cálculo do quórum ficam em funções testáveis fora da interface. Cada reunião tem seu próprio objeto persistente, enquanto o modo local permite demonstrar os fluxos sem a API.

As respostas só podem ser editadas com o mesmo PIN; tentativas incorretas são limitadas. O resultado apresenta disponibilidade e quórum, mas deixa a decisão final de horário para o grupo.

## Testes e evidências

`npm test` executa a suíte Node.js do projeto e do Worker. Os testes cobrem os 90 intervalos de horário, limites de entrada, duplicatas, votação, PIN, horários inválidos, expiração e mensagens de resultado. A suíte passou com 7 testes no ambiente local.

O repositório contém a implementação da interface, as regras de domínio, o Worker e os testes. A interface está disponível na rota do portfólio. O endpoint remoto está configurado no projeto, mas sua disponibilidade atual não é afirmada por este relato.

[Abrir a aplicação]({{ '/bora-marcar/' | relative_url }}) · [Ver o repositório no GitHub](https://github.com/annysource/annysource.github.io)
