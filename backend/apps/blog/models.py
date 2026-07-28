"""
apps/blog/models.py
───────────────────
Data layer for the blog feature.

Models
------
BlogCategory      — taxonomy for organising articles (meteorology, backend, etc.)
BlogArticle       — the main content unit; Markdown body converted to safe HTML on demand
BlogComment       — threaded comments (parent FK for nested replies); fingerprint-free
BlogLike          — one like per (article, fingerprint); toggled via API
BlogReaction      — one emoji reaction per (article, fingerprint); 5 types; swap-or-remove
BlogShareCount    — per-platform share counter; incremented client-side on share action

Fingerprint
-----------
A UUID stored in the browser's localStorage (key "_fp") and sent as the
X-Fingerprint header identifies anonymous interactions without requiring auth.
"""
import hashlib
from functools import lru_cache

import bleach
import markdown
from django.db import models
from django.db.models import Count
from django.utils.text import slugify

ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'hr', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption',
]
# Only these exact classes survive sanitization on <img> — enough for the
# admin's copy-paste placement snippets (full/left/right/centred) to work,
# without opening up arbitrary class injection.
SAFE_IMG_CLASSES = {'img-left', 'img-right', 'img-center'}


def _img_attr_filter(_tag, name, value):
    if name in ('src', 'alt', 'width', 'height'):
        return True
    if name == 'class':
        return value in SAFE_IMG_CLASSES
    return False


ALLOWED_ATTRS = {
    'a': ['href', 'title', 'rel'],
    'img': _img_attr_filter,
    'figure': ['class'],
    'figcaption': ['class'],
}
# Explicit protocol allowlist for <a href> and <img src>.
# Bleach 6.x strips javascript: hrefs by default, but being explicit is safer.
ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']


@lru_cache(maxsize=256)
def _render_markdown(content_hash: str, content: str) -> str:  # noqa: ARG001 — hash is the cache key
    """Convert Markdown to sanitized HTML. Cached per unique content hash (process-level)."""
    md = markdown.markdown(
        content,
        extensions=['extra', 'codehilite', 'toc', 'sane_lists'],
    )
    return bleach.clean(md, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, protocols=ALLOWED_PROTOCOLS)

LANGUAGE_CHOICES = [
    ('en', 'English'),
    ('sw', 'Swahili'),
    ('fr', 'French'),
    ('pt', 'Portuguese'),
    ('ar', 'Arabic'),
    ('zh', 'Chinese'),
]

REACTION_CHOICES = [
    ('love', '❤️ Love'),
    ('fire', '🔥 Fire'),
    ('clap', '👏 Clap'),
    ('mind_blown', '🤯 Mind Blown'),
    ('insightful', '💡 Insightful'),
]


class BlogCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, max_length=120)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=20, blank=True, default='#d4a574')

    class Meta:
        verbose_name_plural = 'Blog Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def article_count(self):
        return self.articles.filter(is_published=True).count()

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogArticle(models.Model):
    title = models.CharField(max_length=300)
    slug = models.SlugField(unique=True, max_length=320)
    excerpt = models.TextField()
    content = models.TextField(
        help_text=(
            'Supports Markdown. To place an uploaded image at an exact point in the article '
            '(instead of it only appearing in the gallery), scroll to the Images section below, '
            'save once so the snippet fields populate, then copy the snippet for the placement '
            'you want (full width / float left / float right / centred) and paste it into the '
            'content at that point.'
        )
    )
    thumbnail = models.ImageField(upload_to='blog/thumbnails/', blank=True, null=True)
    thumbnail_alt = models.CharField(max_length=200, blank=True)
    category = models.ForeignKey(
        BlogCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='articles'
    )
    tags = models.JSONField(default=list, blank=True, help_text='["tag1", "tag2"]')
    author = models.CharField(max_length=200, default='Msizi')
    author_bio = models.TextField(blank=True)
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    read_time = models.PositiveIntegerField(default=5, help_text='Minutes')
    views = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True, db_index=True)
    allow_comments = models.BooleanField(default=True)
    published_date = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_date']

    def __str__(self):
        return self.title

    def get_content_html(self):
        content_hash = hashlib.md5(self.content.encode(), usedforsecurity=False).hexdigest()
        return _render_markdown(content_hash, self.content)

    @property
    def like_count(self):
        return self.likes.count()

    @property
    def comment_count(self):
        return self.comments.filter(is_approved=True, parent=None).count()

    @property
    def reaction_summary(self):
        counts = dict(
            self.reactions.values('reaction').annotate(n=Count('id')).values_list('reaction', 'n')
        )
        return {rtype: counts.get(rtype, 0) for rtype, _ in REACTION_CHOICES}

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class BlogImage(models.Model):
    PLACEMENT_CHOICES = [
        ('full', 'Full width'),
        ('right', 'Float right'),
        ('left', 'Float left'),
        ('center', 'Centered'),
    ]
    article = models.ForeignKey(BlogArticle, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='blog/images/')
    alt_text = models.CharField(max_length=200, blank=True)
    caption = models.CharField(max_length=300, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'Image for "{self.article.title}" #{self.order}'


class BlogComment(models.Model):
    article = models.ForeignKey(BlogArticle, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies'
    )
    author_name = models.CharField(max_length=100)
    author_email = models.EmailField()
    content = models.TextField()
    is_approved = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    likes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.author_name} on "{self.article.title}"'


class BlogLike(models.Model):
    article = models.ForeignKey(BlogArticle, on_delete=models.CASCADE, related_name='likes')
    fingerprint = models.CharField(max_length=64)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['article', 'fingerprint']

    def __str__(self):
        return f'Like on "{self.article.title}"'


class BlogReaction(models.Model):
    article = models.ForeignKey(BlogArticle, on_delete=models.CASCADE, related_name='reactions')
    reaction = models.CharField(max_length=20, choices=REACTION_CHOICES)
    fingerprint = models.CharField(max_length=64)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['article', 'fingerprint']

    def __str__(self):
        return f'{self.reaction} on "{self.article.title}"'


class BlogShareCount(models.Model):
    PLATFORMS = [
        ('twitter', 'Twitter / X'),
        ('facebook', 'Facebook'),
        ('linkedin', 'LinkedIn'),
        ('whatsapp', 'WhatsApp'),
        ('copy_link', 'Copy Link'),
    ]
    article = models.ForeignKey(BlogArticle, on_delete=models.CASCADE, related_name='share_counts')
    platform = models.CharField(max_length=20, choices=PLATFORMS)
    count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['article', 'platform']

    def __str__(self):
        return f'{self.platform} shares for "{self.article.title}"'
