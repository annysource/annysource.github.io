---
cover: "/assets/images/devonboard%20(1).png"
cover_alt: "Captura da experiência DevOnboard XR em um ambiente virtual de onboarding"
title: "DevOnboard XR — onboarding de desenvolvedores em realidade virtual"
role: "Desenvolvimento full-stack e integração de sistemas"
area: "Engenharia de Software · IA Aplicada · XR"
category: engineer
featured: true
order: 1
home_featured: true
home_order: 1
problem: "O onboarding precisava conectar uma experiência em realidade virtual, uma API, um serviço de IA generativa e um painel web."
contribution: "Implementei os componentes do monorepo e suas integrações: cliente XR em Unity, API FastAPI, agente com Gemini e painel React."
evidence_summary: "MVP executado localmente em APK no Meta Quest 3; o monorepo inclui quatro testes Pytest para rotas da API."
project_stage: "MVP executado localmente no Meta Quest 3 a partir de um APK."
summary: "Onboarding de desenvolvedores em realidade virtual no Meta Quest 3, integrado a uma API FastAPI, ao Google Gemini e a um painel web."
technologies: ["Python", "FastAPI", "Google Gemini SDK", "React", "TypeScript", "Vite", "Pytest", "OpenAPI", "Git", "Unity", "Meta Quest 3"]
repository_url: "https://github.com/annysource/Devonboard-XR"
gallery:
  - src: "/assets/images/devonboard%20(1).png"
    alt: "Ambiente virtual de onboarding com instruções de boas-vindas e controles de realidade virtual"
    caption: "Instruções de boas-vindas no ambiente XR."
  - src: "/assets/images/devonboard%20(2).png"
    alt: "Ambiente virtual exibindo uma mensagem de espera"
    caption: "Cena do ambiente virtual durante o carregamento."
  - src: "/assets/images/devonboard%20(3).png"
    alt: "Interior do ambiente virtual de onboarding com balcão, escada e mensagem de espera"
    caption: "Ambiente virtual de onboarding."
  - src: "/assets/images/devonboard%20(4).png"
    alt: "Ambiente virtual com mensagem de resposta Mock do assistente"
    caption: "Resposta Mock exibida no ambiente XR."
---

## Etapa 1 · MBA UFRJ

### DevOnboard — concepção da solução

Projeto acadêmico desenvolvido em grupo na disciplina **Ferramentas para Geração de Ideias**, do MBA em Engenharia de Software da UFRJ. A equipe investigou o problema do onboarding técnico e a dificuldade de novos desenvolvedores para encontrar informações, compreender a arquitetura e se adaptar às equipes.

A concepção utilizou Design Thinking e Diamante Duplo e incluiu:

- Investigação do problema de onboarding técnico;
- Definição da proposta de valor;
- Modelagem da arquitetura e dos módulos da solução;
- Prototipação conceitual no Figma.

Esta etapa foi de concepção e prototipação; a implementação de software descrita abaixo foi desenvolvida independentemente.

[Consultar o relatório acadêmico do DevOnboard (PDF)]({{ '/assets/documents/DevOnboard_Relat%C3%B3rio_Final.pdf' | relative_url }})

## Etapa 2 · Desenvolvimento independente

### DevOnboard XR — evolução técnica

Adaptei a proposta original para explorar desenvolvimento de software, IA generativa e experiência imersiva. O resultado é um MVP executado localmente no Meta Quest 3 a partir de um APK, integrado a um backend e a um painel web.

O desenvolvimento inclui uma API REST com Python e FastAPI, integração com Google Gemini, painel web com React e TypeScript, testes automatizados da API com Pytest e uma estratégia de fallback para resposta Mock quando o serviço externo de IA falha.

## Arquitetura técnica

- **Cliente XR:** aplicação em Unity executada localmente no Meta Quest 3 por APK. Scripts verificam a saúde da API e enviam mensagens de chat por requisições HTTP; um gatilho da experiência pode iniciar uma mensagem para o agente.
- **Backend:** a API FastAPI expõe rotas REST para health check, início e progresso do onboarding, eventos de telemetria e chat. O FastAPI também disponibiliza a documentação OpenAPI.
- **Serviço de IA:** o módulo do agente carrega a credencial com `dotenv` e chama o Google Gemini SDK. Se a chamada ao provedor falhar, retorna uma resposta Mock.
- **Frontend web:** o painel em React e TypeScript envia mensagens à rota de chat da API e apresenta a resposta recebida.
- **Organização:** os componentes ficam em um monorepo e usam Git para versionamento.

Os clientes XR e web enviam mensagens à API por requisições HTTP. O backend também expõe rotas para consultar o progresso do onboarding e receber eventos de telemetria.

## Decisões de engenharia

O backend mantém a integração com o provedor de IA atrás de uma função do agente. Quando a chamada ao Gemini levanta uma exceção — inclusive em caso de indisponibilidade do serviço, como um erro 503 — o agente retorna uma resposta Mock conhecida, em vez de deixar a falha do provedor interromper o fluxo de chat da API.

As credenciais são carregadas do arquivo de ambiente do agente, em vez de serem inseridas no cliente XR ou no painel web. A API valida os dados de entrada com modelos Pydantic, enquanto as rotas REST deixam explícitos os pontos de integração entre a aplicação e seus clientes.

## Stack tecnológica

Python, FastAPI, Pydantic, Google Gemini SDK, `python-dotenv`, React, TypeScript, Vite, Pytest, OpenAPI, Unity, Meta Quest 3 e Git.

## Testes e evidências

O monorepo contém quatro testes Pytest para a API: health check, início do onboarding, consulta de progresso e registro de evento de telemetria. Eles verificam respostas e campos dessas rotas.

O código do agente implementa o fallback para uma resposta Mock quando a chamada ao Gemini falha, mantendo uma resposta para o fluxo de onboarding.

## Capturas da experiência

As imagens a seguir mostram cenas do ambiente virtual e a resposta Mock apresentada no cliente XR.

{% include gallery.html photos=page.gallery %}

## Código

[Ver o repositório DevOnboard XR no GitHub](https://github.com/annysource/Devonboard-XR)
