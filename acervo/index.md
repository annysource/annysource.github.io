---
layout: library
title: Acervo
kicker: Ideias que circulam
---
<h2 id="midia">Entrevistas & podcasts</h2>

Conversas sobre tecnologia, games e minha atuação profissional.

<!-- Adicionar título, veículo, data, papel e link público de cada entrevista ou podcast. -->

<h2 id="palestras">Palestras</h2>

Participações em palestras.

<!-- Adicionar título, evento, data, papel e link público de cada participação. -->

<h2 id="juris">Júris</h2>

Participações como jurada.

<!-- Adicionar evento, data, papel e link público de cada participação como jurada. -->

<h2 id="comunidade">Comunidade e organização</h2>

Organizei game jams e colaborei com associações. Também participei de testathons e hackathons.

<!-- Organizar registros por evento: nome, ano, papel, imagem e link. Diferenciar organização e participação. -->

<h2 id="reconhecimento">Reconhecimentos</h2>

Registros de prêmios e outros reconhecimentos recebidos.

<!-- Adicionar nome, instituição, data e evidência pública de cada reconhecimento. -->

<h2 id="encontros" class="icon-heading"><img class="section-icon " src="{{ '/assets/icons/encounters.svg' | relative_url }}" width="64" height="64" alt="" aria-hidden="true"><span>Encontros & bastidores</span></h2>

{% for post in site.posts %}
{% assign selected_photos = post.gallery | where: 'featured', true %}
{% if selected_photos.size > 0 %}
<h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
{% include gallery.html photos=selected_photos %}
{% endif %}
{% endfor %}
