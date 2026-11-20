from django import forms
from django.conf import settings
from django.contrib import admin
from django.db.models import Max
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.urls import path
from django.utils.html import format_html, format_html_join
from django.utils.text import Truncator

from utils.media import media_url

from .models import BlogArticle, BlogCategory, BlogComment, BlogImage, BlogLike, BlogReaction
from .notifications import notify_commenter_of_reply


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "color_swatch", "article_count"]
    prepopulated_fields = {"slug": ("name",)}

    def color_swatch(self, obj):
        return format_html(
            '<span style="display:inline-block;width:16px;height:16px;background:{};border-radius:3px;"></span>',
            obj.color or "#ccc",
        )

    color_swatch.short_description = "Color"


class BlogImageInline(admin.StackedInline):
    model = BlogImage
    extra = 2
    fields = ["image", "alt_text", "caption", "order", "placement_snippets"]
    readonly_fields = ["placement_snippets"]

    def placement_snippets(self, obj):
        if not obj.pk or not obj.image:
            return format_html(
                '<span style="color:#999;font-size:12px;">Save the article after uploading to see placement snippets.</span>'
            )
        try:
            url = obj.image.url
        except Exception:
            return "—"
        cap = obj.alt_text or obj.caption or "image"
        style = (
            "background:#f8f8f8;border:1px solid #e0e0e0;border-radius:6px;"
            "padding:12px 14px;font-family:monospace;font-size:12px;line-height:1.8;"
        )
        row = '<div style="margin-bottom:4px;"><strong style="color:#555;font-size:11px;">{label}:</strong> '
        row += '<code style="background:#fff;padding:2px 6px;border:1px solid #ddd;border-radius:3px;user-select:all;">{snippet}</code></div>'
        return format_html(
            '<div style="{style}">'
            '<p style="margin:0 0 8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.05em;">📋 Copy a snippet and paste it into your content at the desired position</p>'
            '<p style="margin:0 0 8px;font-size:11px;color:#aaa;">If you don\'t paste any snippet for this image, it will still be shown automatically in a gallery at the end of the article.</p>'
            "{full}{right}{left}{center}"
            "</div>",
            style=style,
            full=format_html(row, label="Full width", snippet=f"![{cap}]({url})"),
            right=format_html(row, label="Float right", snippet=f"![{cap}]({url}){{.img-right}}"),
            left=format_html(row, label="Float left", snippet=f"![{cap}]({url}){{.img-left}}"),
            center=format_html(row, label="Centred", snippet=f"![{cap}]({url}){{.img-center}}"),
        )

    placement_snippets.short_description = "Paste into content"


class CommentInline(admin.TabularInline):
    model = BlogComment
    extra = 0
    fields = ["author_name", "content", "is_approved", "is_author", "created_at"]
    readonly_fields = ["created_at"]
    show_change_link = True


class BlogArticleAdminForm(forms.ModelForm):
    class Meta:
        model = BlogArticle
        fields = [
            "title",
            "slug",
            "excerpt",
            "content",
            "thumbnail",
            "thumbnail_alt",
            "category",
            "tags",
            "author",
            "author_bio",
            "language",
            "read_time",
            "views",
            "is_featured",
            "is_published",
            "allow_comments",
        ]
        widgets = {
            "content": forms.Textarea(attrs={"class": "blog-content-editor", "rows": 20}),
        }

    class Media:
        css = {"all": ("blog/vendor/easymde.min.css",)}
        js = ("blog/vendor/easymde.min.js", "blog/admin_editor.js")


@admin.register(BlogArticle)
class BlogArticleAdmin(admin.ModelAdmin):
    form = BlogArticleAdminForm
    list_display = [
        "thumbnail_preview",
        "title",
        "category",
        "language",
        "author",
        "is_featured",
        "is_published",
        "views",
        "like_count",
        "comment_count",
        "published_date",
    ]
    list_filter = ["category", "language", "is_featured", "is_published", "allow_comments"]
    search_fields = ["title", "excerpt", "content", "author"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["views", "published_date", "updated_at", "like_count", "comment_count"]
    list_editable = ["is_featured", "is_published"]
    list_display_links = ["title"]
    inlines = [BlogImageInline, CommentInline]
    fieldsets = (
        # "Content" is listed first so it's the tab that opens by default —
        # title/category/body are what an author needs immediately, not the
        # publishing toggles.
        (
            "Content",
            {
                "fields": ("title", "slug", "category", "excerpt", "content", "tags"),
            },
        ),
        (
            "Media",
            {
                "fields": ("thumbnail", "thumbnail_alt"),
            },
        ),
        (
            "Publishing",
            {
                "fields": ("is_featured", "is_published", "allow_comments"),
            },
        ),
        (
            "Authorship & Language",
            {
                "fields": ("author", "author_bio", "language", "read_time"),
            },
        ),
        (
            "Statistics",
            {
                "fields": ("views", "like_count", "comment_count", "published_date", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )
    save_on_top = True

    def thumbnail_preview(self, obj):
        if obj.thumbnail:
            return format_html(
                '<img src="{}" style="width:48px;height:36px;object-fit:cover;border-radius:4px;">',
                obj.thumbnail.url,
            )
        return format_html('<span style="color:#999;font-size:11px;">No image</span>')

    thumbnail_preview.short_description = ""

    def like_count(self, obj):
        return obj.like_count

    like_count.short_description = "❤️"

    def comment_count(self, obj):
        return obj.comment_count

    comment_count.short_description = "💬"

    def get_urls(self):
        custom = [
            path(
                "<int:article_id>/upload-editor-image/",
                self.admin_site.admin_view(self.upload_editor_image),
                name="blog_blogarticle_upload_editor_image",
            ),
        ]
        return custom + super().get_urls()

    def upload_editor_image(self, request, article_id):
        """Image-editor toolbar upload target — used by admin_editor.js.

        Saves the file as a BlogImage (so it also appears in the gallery /
        image list like any other upload) and hands back its URL for the
        editor to insert into the content at the cursor position.
        """
        if request.method != "POST" or "image" not in request.FILES:
            return JsonResponse({"error": "No image provided"}, status=400)
        article = get_object_or_404(BlogArticle, pk=article_id)
        next_order = (article.images.aggregate(Max("order"))["order__max"] or 0) + 1
        image = BlogImage.objects.create(
            article=article, image=request.FILES["image"], order=next_order
        )
        return JsonResponse({"url": media_url(request, image.image)})


class BlogCommentAdminForm(forms.ModelForm):
    owner_reply = forms.CharField(
        label="Your reply",
        required=False,
        widget=forms.Textarea(attrs={"rows": 5, "placeholder": "Write a reply as the author…"}),
        help_text=(
            "Posted on the article straight away with an Author badge, and the reader is "
            "emailed a link to it. Replying also approves this comment."
        ),
    )

    class Meta:
        model = BlogComment
        fields = [
            "article",
            "parent",
            "author_name",
            "author_email",
            "content",
            "is_approved",
            "is_author",
            "likes",
        ]


@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    form = BlogCommentAdminForm
    list_display = [
        "author_name",
        "excerpt",
        "article",
        "is_approved",
        "answered",
        "created_at",
    ]
    list_display_links = ["author_name", "excerpt"]
    list_filter = ["is_approved", "is_author", "article"]
    list_editable = ["is_approved"]
    readonly_fields = ["thread", "ip_address", "created_at"]
    search_fields = ["author_name", "author_email", "content"]
    actions = ["approve_comments", "reject_comments"]
    fieldsets = (
        ("Reply", {"fields": ("owner_reply", "thread")}),
        (
            "Comment",
            {
                "fields": (
                    "article",
                    "parent",
                    "author_name",
                    "author_email",
                    "content",
                    "is_approved",
                    "is_author",
                )
            },
        ),
        ("Details", {"fields": ("likes", "ip_address", "created_at"), "classes": ("collapse",)}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("article", "parent")

    @admin.display(description="Comment")
    def excerpt(self, obj):
        prefix = "↳ " if obj.parent_id else ""
        return prefix + Truncator(obj.content).chars(80)

    @admin.display(description="Answered", boolean=True)
    def answered(self, obj):
        if obj.is_author:
            return None
        top = obj.parent or obj
        return top.replies.filter(is_author=True, created_at__gt=obj.created_at).exists()

    @admin.display(description="Conversation so far")
    def thread(self, obj):
        if not obj.pk:
            return "—"
        top = obj.parent or obj
        items = [top, *top.replies.order_by("created_at")]
        return format_html(
            '<div style="max-width:720px">{}</div>',
            format_html_join(
                "",
                '<div style="margin:0 0 10px {};padding:10px 12px;border-left:3px solid {};'
                'background:rgba(255,255,255,.04);border-radius:4px">'
                "<strong>{}</strong>{} <span style='opacity:.6;font-size:11px'>{}</span>"
                '<div style="margin-top:4px;white-space:pre-wrap">{}</div></div>',
                (
                    (
                        "0" if c.pk == top.pk else "24px",
                        "#f39c12" if c.is_author else ("#6c757d" if c.is_approved else "#dc3545"),
                        c.author_name,
                        " · Author"
                        if c.is_author
                        else ("" if c.is_approved else " · not approved"),
                        c.created_at.strftime("%d %b %Y, %H:%M"),
                        c.content,
                    )
                    for c in items
                ),
            ),
        )

    def save_model(self, request, obj, form, change):
        reply_text = (form.cleaned_data.get("owner_reply") or "").strip()
        if reply_text:
            obj.is_approved = True
        super().save_model(request, obj, form, change)
        if not reply_text:
            return
        reply = BlogComment.objects.create(
            article=obj.article,
            parent=obj.parent or obj,  # threads are one level deep
            author_name=obj.article.author or request.user.get_full_name() or "Author",
            author_email=settings.ADMIN_EMAIL or request.user.email or "noreply@koboko.co.ke",
            content=reply_text,
            is_approved=True,
            is_author=True,
        )
        # Email the person being answered (this comment's author), even if it is
        # itself a reply further down the thread.
        reply.parent = obj
        notify_commenter_of_reply(reply)
        self.message_user(request, f"Reply posted and {obj.author_name} has been emailed.")

    @admin.action(description="Approve selected comments")
    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description="Reject selected comments")
    def reject_comments(self, request, queryset):
        queryset.update(is_approved=False)


@admin.register(BlogLike)
class BlogLikeAdmin(admin.ModelAdmin):
    list_display = ["article", "ip_address", "created_at"]
    readonly_fields = ["article", "fingerprint", "ip_address", "created_at"]


@admin.register(BlogReaction)
class BlogReactionAdmin(admin.ModelAdmin):
    list_display = ["article", "reaction", "ip_address", "created_at"]
    list_filter = ["reaction"]
    readonly_fields = ["article", "reaction", "fingerprint", "ip_address", "created_at"]
