from django import forms
from django.contrib import admin
from django.db.models import Max
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.urls import path
from django.utils.html import format_html

from utils.media import media_url

from .models import BlogArticle, BlogCategory, BlogComment, BlogImage, BlogLike, BlogReaction


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'color_swatch', 'article_count']
    prepopulated_fields = {'slug': ('name',)}

    def color_swatch(self, obj):
        return format_html(
            '<span style="display:inline-block;width:16px;height:16px;background:{};border-radius:3px;"></span>',
            obj.color or '#ccc'
        )
    color_swatch.short_description = 'Color'


class BlogImageInline(admin.StackedInline):
    model = BlogImage
    extra = 2
    fields = ['image', 'alt_text', 'caption', 'order', 'placement_snippets']
    readonly_fields = ['placement_snippets']

    def placement_snippets(self, obj):
        if not obj.pk or not obj.image:
            return format_html('<span style="color:#999;font-size:12px;">Save the article after uploading to see placement snippets.</span>')
        try:
            url = obj.image.url
        except Exception:
            return '—'
        cap = obj.alt_text or obj.caption or 'image'
        style = (
            'background:#f8f8f8;border:1px solid #e0e0e0;border-radius:6px;'
            'padding:12px 14px;font-family:monospace;font-size:12px;line-height:1.8;'
        )
        row = '<div style="margin-bottom:4px;"><strong style="color:#555;font-size:11px;">{label}:</strong> '
        row += '<code style="background:#fff;padding:2px 6px;border:1px solid #ddd;border-radius:3px;user-select:all;">{snippet}</code></div>'
        return format_html(
            '<div style="{style}">'
            '<p style="margin:0 0 8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.05em;">📋 Copy a snippet and paste it into your content at the desired position</p>'
            '<p style="margin:0 0 8px;font-size:11px;color:#aaa;">If you don\'t paste any snippet for this image, it will still be shown automatically in a gallery at the end of the article.</p>'
            '{full}{right}{left}{center}'
            '</div>',
            style=style,
            full=format_html(row, label='Full width', snippet=f'![{cap}]({url})'),
            right=format_html(row, label='Float right', snippet=f'![{cap}]({url}){{.img-right}}'),
            left=format_html(row, label='Float left', snippet=f'![{cap}]({url}){{.img-left}}'),
            center=format_html(row, label='Centred', snippet=f'![{cap}]({url}){{.img-center}}'),
        )
    placement_snippets.short_description = 'Paste into content'


class CommentInline(admin.TabularInline):
    model = BlogComment
    extra = 0
    fields = ['author_name', 'content', 'is_approved', 'created_at']
    readonly_fields = ['created_at']
    show_change_link = True


class BlogArticleAdminForm(forms.ModelForm):
    class Meta:
        model = BlogArticle
        fields = '__all__'
        widgets = {
            'content': forms.Textarea(attrs={'class': 'blog-content-editor', 'rows': 20}),
        }

    class Media:
        css = {'all': ('blog/vendor/easymde.min.css',)}
        js = ('blog/vendor/easymde.min.js', 'blog/admin_editor.js')


@admin.register(BlogArticle)
class BlogArticleAdmin(admin.ModelAdmin):
    form = BlogArticleAdminForm
    list_display = [
        'thumbnail_preview', 'title', 'category', 'language', 'author',
        'is_featured', 'is_published', 'views', 'like_count', 'comment_count', 'published_date',
    ]
    list_filter = ['category', 'language', 'is_featured', 'is_published', 'allow_comments']
    search_fields = ['title', 'excerpt', 'content', 'author']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['views', 'published_date', 'updated_at', 'like_count', 'comment_count']
    list_editable = ['is_featured', 'is_published']
    list_display_links = ['title']
    inlines = [BlogImageInline, CommentInline]
    fieldsets = (
        # "Content" is listed first so it's the tab that opens by default —
        # title/category/body are what an author needs immediately, not the
        # publishing toggles.
        ('Content', {
            'fields': ('title', 'slug', 'category', 'excerpt', 'content', 'tags'),
        }),
        ('Media', {
            'fields': ('thumbnail', 'thumbnail_alt'),
        }),
        ('Publishing', {
            'fields': ('is_featured', 'is_published', 'allow_comments'),
        }),
        ('Authorship & Language', {
            'fields': ('author', 'author_bio', 'language', 'read_time'),
        }),
        ('Statistics', {
            'fields': ('views', 'like_count', 'comment_count', 'published_date', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    save_on_top = True

    def thumbnail_preview(self, obj):
        if obj.thumbnail:
            return format_html(
                '<img src="{}" style="width:48px;height:36px;object-fit:cover;border-radius:4px;">',
                obj.thumbnail.url
            )
        return format_html('<span style="color:#999;font-size:11px;">No image</span>')
    thumbnail_preview.short_description = ''

    def like_count(self, obj):
        return obj.like_count
    like_count.short_description = '❤️'

    def comment_count(self, obj):
        return obj.comment_count
    comment_count.short_description = '💬'

    def get_urls(self):
        custom = [
            path(
                '<int:article_id>/upload-editor-image/',
                self.admin_site.admin_view(self.upload_editor_image),
                name='blog_blogarticle_upload_editor_image',
            ),
        ]
        return custom + super().get_urls()

    def upload_editor_image(self, request, article_id):
        """Image-editor toolbar upload target — used by admin_editor.js.

        Saves the file as a BlogImage (so it also appears in the gallery /
        image list like any other upload) and hands back its URL for the
        editor to insert into the content at the cursor position.
        """
        if request.method != 'POST' or 'image' not in request.FILES:
            return JsonResponse({'error': 'No image provided'}, status=400)
        article = get_object_or_404(BlogArticle, pk=article_id)
        next_order = (article.images.aggregate(Max('order'))['order__max'] or 0) + 1
        image = BlogImage.objects.create(
            article=article, image=request.FILES['image'], order=next_order
        )
        return JsonResponse({'url': media_url(request, image.image)})


@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ['author_name', 'article', 'parent', 'is_approved', 'created_at']
    list_filter = ['is_approved', 'article']
    list_editable = ['is_approved']
    readonly_fields = ['ip_address', 'created_at']
    search_fields = ['author_name', 'author_email', 'content']
    actions = ['approve_comments', 'reject_comments']

    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)
    approve_comments.short_description = 'Approve selected comments'

    def reject_comments(self, request, queryset):
        queryset.update(is_approved=False)
    reject_comments.short_description = 'Reject selected comments'


@admin.register(BlogLike)
class BlogLikeAdmin(admin.ModelAdmin):
    list_display = ['article', 'ip_address', 'created_at']
    readonly_fields = ['article', 'fingerprint', 'ip_address', 'created_at']


@admin.register(BlogReaction)
class BlogReactionAdmin(admin.ModelAdmin):
    list_display = ['article', 'reaction', 'ip_address', 'created_at']
    list_filter = ['reaction']
    readonly_fields = ['article', 'reaction', 'fingerprint', 'ip_address', 'created_at']
