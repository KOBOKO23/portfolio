"""
apps/core/views_meta.py — Server-rendered HTML with correct per-page Open Graph /
Twitter Card / JSON-LD metadata for content pages, so non-JS crawlers and social
link-unfurlers (which don't execute the React app's client-side react-helmet-async
tags) see accurate titles, descriptions, and images.

These are NOT user-facing pages — real visitors never see them. A Vercel edge
middleware on the frontend detects known bot User-Agents on /blog/<slug>,
/projects/<slug>, and /book, and transparently proxies just those requests here;
everyone else gets the normal SPA, unchanged. See src/middleware.ts.

Endpoints (mounted at /meta/ in config/urls.py)
  GET  meta/blog/<slug>/       — BlogArticle
  GET  meta/projects/<slug>/   — Project
  GET  meta/book/              — the (single) Book record
"""
import json

from django.conf import settings
from django.shortcuts import get_object_or_404, render

from utils.media import media_url

FRONTEND_URL = getattr(settings, 'SITE_URL', 'https://koboko.dev')
GITHUB_URL = getattr(settings, 'GITHUB_URL', 'https://github.com/KOBOKO23')
TWITTER_HANDLE = getattr(settings, 'TWITTER_HANDLE', 'kobokophilip')
DEFAULT_IMAGE = f'{FRONTEND_URL}/og-image.jpg'

PERSON_LD = {
    '@type': 'Person',
    'name': 'Koboko Philip',
    'url': FRONTEND_URL,
    'jobTitle': 'Meteorologist · Backend Developer · Data Scientist',
    'address': {'@type': 'PostalAddress', 'addressLocality': 'Nairobi', 'addressCountry': 'KE'},
    'sameAs': [GITHUB_URL, f'https://twitter.com/{TWITTER_HANDLE}'],
}


def _safe_json_ld(data: dict) -> str:
    """Serialize for embedding in <script type="application/ld+json">.

    json.dumps doesn't HTML-escape, so a stray "</script>" inside admin-authored
    text (a title, an excerpt) could otherwise break out of the script tag.
    """
    return json.dumps(data, default=str).replace('</', '<\\/')


def _render_meta(request, *, title, description, image, url, og_type, json_ld,
                  twitter_handle=TWITTER_HANDLE, extra_og_properties=None):
    return render(request, 'meta/base.html', {
        'title': title,
        'description': description,
        'image': image,
        'url': url,
        'og_type': og_type,
        'twitter_handle': twitter_handle,
        'extra_og_properties': extra_og_properties or [],
        'json_ld': _safe_json_ld(json_ld),
    })


def blog_article_meta(request, slug):
    from apps.blog.models import BlogArticle

    article = get_object_or_404(BlogArticle, slug=slug, is_published=True)
    image = media_url(request, article.thumbnail) or DEFAULT_IMAGE
    url = f'{FRONTEND_URL}/blog/{article.slug}'

    json_ld = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': article.title,
        'description': article.excerpt,
        'image': image,
        'url': url,
        'datePublished': article.published_date.isoformat(),
        'dateModified': article.updated_at.isoformat(),
        'author': PERSON_LD,
        'publisher': {
            **PERSON_LD,
            '@type': 'Organization',
            'logo': {'@type': 'ImageObject', 'url': f'{FRONTEND_URL}/logo.png'},
        },
        'inLanguage': 'en-KE',
        'isAccessibleForFree': True,
    }
    if article.tags:
        json_ld['keywords'] = ', '.join(article.tags)
    if article.category:
        json_ld['articleSection'] = article.category.name

    return _render_meta(
        request,
        title=f'{article.title} — Koboko',
        description=article.excerpt,
        image=image,
        url=url,
        og_type='article',
        json_ld=json_ld,
        extra_og_properties=[
            ('article:published_time', article.published_date.isoformat()),
            ('article:modified_time', article.updated_at.isoformat()),
            ('article:author', article.author),
        ],
    )


def project_meta(request, slug):
    from apps.projects.models import Project

    project = get_object_or_404(Project, slug=slug)
    image = media_url(request, project.image) or DEFAULT_IMAGE
    url = f'{FRONTEND_URL}/projects/{project.slug}'

    json_ld = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        'name': project.title,
        'description': project.description,
        'image': image,
        'url': url,
        'author': PERSON_LD,
    }
    if project.technologies_list:
        json_ld['keywords'] = ', '.join(project.technologies_list)

    return _render_meta(
        request,
        title=f'{project.title} — Koboko',
        description=project.description,
        image=image,
        url=url,
        og_type='website',
        json_ld=json_ld,
    )


def book_meta(request):
    from apps.books.models import Book

    book = get_object_or_404(Book.objects.order_by('order'))
    image = media_url(request, book.cover_image) or DEFAULT_IMAGE
    url = f'{FRONTEND_URL}/book'
    description = book.description[:300]

    json_ld = {
        '@context': 'https://schema.org',
        '@type': 'Book',
        'name': book.title,
        'author': {'@type': 'Person', 'name': book.author},
        'description': description,
        'image': image,
        'url': url,
    }
    if book.isbn:
        json_ld['isbn'] = book.isbn
    if book.page_count:
        json_ld['numberOfPages'] = book.page_count
    if book.release_date:
        json_ld['datePublished'] = book.release_date.isoformat()
    if book.publisher:
        json_ld['publisher'] = {'@type': 'Organization', 'name': book.publisher}

    extra_og_properties = [('book:author', book.author)]
    if book.isbn:
        extra_og_properties.append(('book:isbn', book.isbn))
    if book.release_date:
        extra_og_properties.append(('book:release_date', book.release_date.isoformat()))

    return _render_meta(
        request,
        title=f'{book.title} — Koboko',
        description=description,
        image=image,
        url=url,
        og_type='book',
        json_ld=json_ld,
        extra_og_properties=extra_og_properties,
    )
