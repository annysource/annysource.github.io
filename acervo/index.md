---
layout: library
title: Acervo
kicker: Ideias que circulam
---
<h2 id="midia">Entrevistas & podcasts</h2>

Conversas sobre tecnologia, games e minha atuação profissional.

<!-- Adicionar título, veículo, data, papel e link público de cada entrevista ou podcast. -->

<section id="palestras">
<h2>Palestras</h2>
<p><a href="{{ '/palestras/' | relative_url }}">Registros de palestras e conversas públicas sobre carreira →</a></p>
</section>


<h2 id="juris">Júris</h2>

Participações como jurada.

<!-- Adicionar evento, data, papel e link público de cada participação como jurada. -->

<h2 id="comunidade">Comunidade e organização</h2>

Organizei game jams e colaborei com associações. Também participei de testathons e hackathons.

<p><a href="{{ '/game-creators/' | relative_url }}">Game Creators Vale do Café — conheça a comunidade de desenvolvimento de jogos do Vale do Café e Sul Fluminense →</a></p>

<!-- Organizar registros por evento: nome, ano, papel, imagem e link. Diferenciar organização e participação. -->

<h3 id="snx-vr-hackathon-2019">SNX.VR Hackathon — swissnex Brazil</h3>

**Participante convidada · Rio de Janeiro · 17 e 18 de agosto de 2019**

A convite do consulado suíço, participei do hackathon promovido pela swissnex Brazil, que reuniu arte, neurociência e realidade virtual para explorar a respiração como forma de interação no mundo HanaHana.

Com minha equipe, desenvolvemos em **Unity e C#** uma intervenção que conecta a intensidade do sopro à abertura de mãos virtuais e à emissão de notas musicais. Conquistamos o **terceiro lugar** e apresentamos a criação no Parque das Ruínas, em Santa Teresa.

[Conhecer o projeto, a equipe e os registros →]({{ '/projetos/hana-hana/' | relative_url }})

[Assistir ao vídeo do evento ↗](https://www.youtube.com/watch?v=92lbYq7baDE)

<h2 id="reconhecimento">Reconhecimentos</h2>

Registros de prêmios e outros reconhecimentos recebidos.

<!-- Adicionar nome, instituição, data e evidência pública de cada reconhecimento. -->

- **3º lugar em equipe — SNX.VR Hackathon, 2019.** Intervenção com sopro, movimento e música no mundo HanaHana. [Ver participação e registros]({{ '/acervo/#snx-vr-hackathon-2019' | relative_url }}).

<h2 id="encontros" class="icon-heading"><img class="section-icon " src="{{ '/assets/icons/encounters.svg' | relative_url }}" width="64" height="64" alt="" aria-hidden="true"><span>Encontros & bastidores</span></h2>

{% for post in site.posts %}
{% assign selected_photos = post.gallery | where: 'featured', true %}
{% if selected_photos.size > 0 %}
<h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
{% include gallery.html photos=selected_photos %}
{% endif %}
{% endfor %}
