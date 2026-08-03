from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.syndication.views import Feed
from django.http import HttpResponse
from django.urls import include, path

from apps.core import views_meta

SITE_URL = getattr(settings, 'SITE_URL', 'https://koboko.dev')

SITEMAP_STATIC = [
    ('/', '1.0', 'weekly'),
    ('/about', '0.9', 'monthly'),
    ('/projects', '0.8', 'weekly'),
    ('/blog', '0.9', 'daily'),
    ('/music', '0.7', 'monthly'),
    ('/book', '0.8', 'monthly'),
    ('/great-men-moves', '0.7', 'monthly'),
    ('/newsletter', '0.7', 'monthly'),
    ('/fashion', '0.6', 'monthly'),
    ('/contact', '0.5', 'yearly'),
    ('/weather-forecast', '0.6', 'daily'),
]


def robots_txt(request):
    lines = [
        'User-agent: *',
        'Disallow: /admin/',
        'Disallow: /api/',
        f'Sitemap: {SITE_URL}/sitemap.xml',
    ]
    return HttpResponse('\n'.join(lines), content_type='text/plain')


def sitemap_xml(request):
    from apps.blog.models import BlogArticle
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path_loc, priority, freq in SITEMAP_STATIC:
        lines.append(
            f'  <url><loc>{SITE_URL}{path_loc}</loc>'
            f'<priority>{priority}</priority>'
            f'<changefreq>{freq}</changefreq></url>'
        )
    try:
        for article in BlogArticle.objects.filter(is_published=True).values('slug', 'updated_at'):
            lines.append(
                f'  <url><loc>{SITE_URL}/blog/{article["slug"]}</loc>'
                f'<lastmod>{article["updated_at"].date()}</lastmod>'
                f'<priority>0.7</priority>'
                f'<changefreq>monthly</changefreq></url>'
            )
    except Exception:  # noqa: S110 — sitemap is best-effort; DB may not be ready at startup
        pass
    try:
        from apps.projects.models import Project
        for project in Project.objects.all().values('slug'):
            lines.append(
                f'  <url><loc>{SITE_URL}/projects/{project["slug"]}</loc>'
                f'<priority>0.8</priority>'
                f'<changefreq>monthly</changefreq></url>'
            )
    except Exception:  # noqa: S110 — sitemap is best-effort; DB may not be ready at startup
        pass
    lines.append('</urlset>')
    return HttpResponse('\n'.join(lines), content_type='application/xml')


class LatestArticlesFeed(Feed):
    """RSS 2.0 feed of published blog articles.

    django.contrib.sites isn't installed, so Django would otherwise derive
    the feed's own self-URL (<atom:link rel="self">) from the request host
    and request.is_secure(). Behind CloudFront -> ALB, that scheme detection
    isn't reliable, so feed_url is pinned explicitly via BACKEND_URL instead.
    `link`/`item_link` are absolute frontend URLs and are left untouched by
    Django's domain-adding logic since they already start with https://.
    """
    title = 'Koboko — Blog'
    link = f'{SITE_URL}/blog'
    feed_url = f'{getattr(settings, "BACKEND_URL", "https://api.koboko.co.ke")}/feed/'
    description = (
        'Insights on meteorology, backend development, data science, '
        'faith, and mentorship — from Koboko.'
    )

    def items(self):
        from apps.blog.models import BlogArticle
        return BlogArticle.objects.filter(is_published=True).order_by('-published_date')[:20]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.excerpt

    def item_link(self, item):
        return f'{SITE_URL}/blog/{item.slug}'

    def item_guid(self, item):
        return f'{SITE_URL}/blog/{item.slug}'

    def item_guid_is_permalink(self, item):
        return True

    def item_pubdate(self, item):
        return item.published_date

    def item_updateddate(self, item):
        return item.updated_at

    def item_author_name(self, item):
        return item.author

    def item_categories(self, item):
        return [item.category.name] if item.category else []


_admin_url = getattr(settings, 'ADMIN_URL', 'admin/')

urlpatterns = [
    path(_admin_url, admin.site.urls),
    path('robots.txt', robots_txt),
    path('sitemap.xml', sitemap_xml),
    path('feed/', LatestArticlesFeed()),
    path('meta/blog/<slug:slug>/', views_meta.blog_article_meta),
    path('meta/projects/<slug:slug>/', views_meta.project_meta),
    path('meta/book/', views_meta.book_meta),
    path('api/blog/', include('apps.blog.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/fashion/', include('apps.fashion.urls')),
    path('api/music/', include('apps.music.urls')),
    path('api/books/', include('apps.books.urls')),
    path('api/great-men-moves/', include('apps.great_men_moves.urls')),
    path('api/newsletter/', include('apps.newsletter.urls')),
    path('api/feedback/', include('apps.feedback.urls')),
    path('api/contact/', include('apps.contact.urls')),
    path('api/', include('apps.core.urls')),
    path('api/payments/', include('apps.payments.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
