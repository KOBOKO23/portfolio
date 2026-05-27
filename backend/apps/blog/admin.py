from django.contrib import admin
from django.utils.html import format_html
from .models import BlogCategory, BlogArticle, BlogComment, BlogLike, BlogReaction


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


class CommentInline(admin.TabularInline):
    model = BlogComment
    extra = 0
    fields = ['author_name', 'content', 'is_approved', 'created_at']
    readonly_fields = ['created_at']
    show_change_link = True


@admin.register(BlogArticle)
class BlogArticleAdmin(admin.ModelAdmin):
    list_display = [
        'thumbnail_preview', 'title', 'category', 'language', 'author',
        'is_featured', 'is_published', 'views', 'like_count', 'comment_count', 'published_date',
    ]
    list_filter = ['category', 'language', 'is_featured', 'is_published', 'allow_comments']
    search_fields = ['title', 'excerpt', 'content', 'author']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['views', 'published_date', 'updated_at', 'like_count', 'comment_count']
    list_editable = ['is_featured', 'is_published']
    inlines = [CommentInline]
    fieldsets = (
        ('Content', {
            'fields': ('title', 'slug', 'category', 'excerpt', 'content', 'tags'),
        }),
        ('Media', {
            'fields': ('thumbnail', 'thumbnail_alt'),
        }),
        ('Authorship & Language', {
            'fields': ('author', 'author_bio', 'language', 'read_time'),
        }),
        ('Publishing', {
            'fields': ('is_featured', 'is_published', 'allow_comments'),
            'classes': ('collapse',),
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
