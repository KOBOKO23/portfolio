from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.views.generic import TemplateView

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
    except Exception:
        pass
    try:
        from apps.projects.models import Project
        for project in Project.objects.all().values('slug'):
            lines.append(
                f'  <url><loc>{SITE_URL}/projects/{project["slug"]}</loc>'
                f'<priority>0.8</priority>'
                f'<changefreq>monthly</changefreq></url>'
            )
    except Exception:
        pass
    lines.append('</urlset>')
    return HttpResponse('\n'.join(lines), content_type='application/xml')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('robots.txt', robots_txt),
    path('sitemap.xml', sitemap_xml),
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
