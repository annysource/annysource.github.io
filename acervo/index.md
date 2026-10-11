---
layout: library
title: Acervo
kicker: Ideias que circulam
---
<h2 id="midia">Entrevistas & podcasts</h2>

Conversas sobre tecnologia, games e minha trajetória.

<!-- Adicionar título, veículo, data e link de cada entrevista ou podcast. -->

<h2 id="comunidade">Comunidade & eventos</h2>

Organizei game jams e colaborei com associações. Também participei de testathons e hackathons.

<!-- Organizar registros por evento: nome, ano, papel, imagem e link. Diferenciar organização e participação. -->

<h2 id="reconhecimento">Prêmios, palestras & júris</h2>

Registros de prêmios recebidos, palestras e participações como jurada.

<!-- Adicionar nomes, instituições, datas e evidências públicas. -->


<h2 id="encontros" class="icon-heading"><img class="section-icon " src="{{ '/assets/icons/encounters.svg' | relative_url }}" width="64" height="64" alt="" aria-hidden="true"><span>Encontros & bastidores</span></h2>

Pessoas, lugares e momentos que fazem parte desta trajetória.

{% for post in site.posts %}
{% assign selected_photos = post.gallery | where: 'featured', true %}
{% if selected_photos.size > 0 %}
<h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
{% include gallery.html photos=selected_photos %}
{% endif %}
{% endfor %}
