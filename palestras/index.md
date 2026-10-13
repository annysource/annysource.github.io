---
layout: library
title: Palestras
kicker: Conversas sobre games e tecnologia
description: Palestras e participações públicas de Anny Caroline Sousa.
palestras:
  - id: do-zero-ao-mercado-2026
    title: "Do sacolé na praia ao QA de The Boys"
    mesa: "Do Zero ao Mercado: Como Construir Carreira em Games"
    evento: "3ª edição do seminário Games: um RIO de Oportunidades"
    local: "Sebrae Rio"
    data: "3 de junho de 2026"
    data_ordem: "2026-06-03"
    organizacao: "ACJOGOS-RJ"
    organizacao_url: "https://rj.acjogos.com.br/"
    participacao: "Palestrante convidada"
    summary: "Do sacolé na praia ao QA de The Boys: uma conversa sobre trabalho, empreendedorismo e construção de carreira em games."
    descricao: >-
      Compartilhei os bastidores do meu percurso profissional, de vender sacolé na praia à atuação em Quality Assurance de The Boys: Trigger Warning. A conversa reuniu experiências de trabalho, empreendedorismo e construção de carreira, aproximando o público das possibilidades de atuação na indústria de games.
    noticia_url: "https://odia.ig.com.br/niteroi/2026/06/7259552-eventos-com-tres-dias-de-programacao-sobre-games-inovacao-e-mercado.html"
    gallery:
      - src: /assets/images/palestra-2026-dozeroaomercado.JPG
        alt: "Anny Sousa participa da mesa Do Zero ao Mercado durante o seminário Games: um RIO de Oportunidades"
        caption: "Mesa Do Zero ao Mercado, no seminário Games: um RIO de Oportunidades."
    youtube_id: Vzlcgpy_5vk
---
<p class="intro">Registros de palestras e conversas públicas sobre games e tecnologia.</p>

{% assign sorted_talks = page.palestras | sort: 'data_ordem' | reverse %}
{% for palestra in sorted_talks %}
<details class="talk-entry" id="{{ palestra.id }}">
<summary>
<h2>{{ palestra.title }}</h2>
<p>{{ palestra.summary }}</p>
<span class="talk-expand">Ver detalhes</span>
</summary>
<div class="talk-content">
<dl class="talk-details">
  <dt>Mesa</dt><dd>{{ palestra.mesa }}</dd>
  <dt>Evento</dt><dd>{{ palestra.evento }}</dd>
  <dt>Local e data</dt><dd>{{ palestra.local }} · {{ palestra.data }}</dd>
  <dt>Organização</dt><dd><a href="{{ palestra.organizacao_url | escape }}">{{ palestra.organizacao }}</a></dd>
  <dt>Participação</dt><dd>{{ palestra.participacao }}</dd>
</dl>
<blockquote>{{ palestra.descricao }}</blockquote>
<p><a href="{{ palestra.noticia_url | escape }}">Notícia no Jornal O Dia ↗</a></p>
{% if palestra.youtube_id != "" %}
<div class="talk-youtube">
  <iframe src="https://www.youtube-nocookie.com/embed/{{ palestra.youtube_id | uri_escape }}" title="Gravação: {{ palestra.title | escape }}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>
{% elsif palestra.video != "" %}
<video class="talk-video" controls preload="metadata">
  <source src="{{ palestra.video | relative_url }}" type="video/quicktime">
  <a href="{{ palestra.video | relative_url }}">Abrir gravação da palestra ↗</a>
</video>
{% endif %}
{% if palestra.gallery.size > 0 %}{% include gallery.html photos=palestra.gallery %}{% endif %}
</div>
</details>
{% endfor %}
