---
title: "News"
layout: default
excerpt: "News and updates from VIBE Lab."
sitemap: false
permalink: /allnews.html
---

<main class="vibe-page news-preview">
  <section class="vibe-page-hero" aria-label="News overview">
    <p class="vibe-eyebrow">News</p>
    <h1>News</h1>
  </section>

  <div class="news-archive">
    {% assign previous_year = '' %}
    {% for article in site.data.news %}
      {% assign year = article.date | date: '%Y' %}
      {% if year != previous_year %}
        {% unless forloop.first %}</div></section>{% endunless %}
        <section class="news-year" aria-label="News from {{ year }}">
          <h2>{{ year }}</h2>
          <div>
        {% assign previous_year = year %}
      {% endif %}

      <article class="news-event">
        <time class="news-date" datetime="{{ article.date | date: '%Y-%m-%d' }}">
          {{ article.date | date: '%b %d' | upcase }}
        </time>
        <div class="news-entry{% if article.image %} news-entry-with-image{% endif %}">
          <div>
            {% if article.category %}<span class="news-label">{{ article.category | escape }}</span>{% endif %}
            {% if article.title %}<h3>{{ article.title | escape }}</h3>{% endif %}
            <div class="news-description">{{ article.headline | markdownify }}</div>
          </div>
          {% if article.image %}
            <img class="{% if article.category == 'People' %}news-person-photo{% else %}news-project-image{% endif %}"
                 src="{{ article.image | relative_url }}"
                 alt="{{ article.image_alt | default: article.title | escape }}"
                 loading="lazy" decoding="async">
          {% endif %}
        </div>
      </article>

      {% if forloop.last %}</div></section>{% endif %}
    {% endfor %}
  </div>
</main>
