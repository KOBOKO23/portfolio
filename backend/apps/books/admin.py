from django.contrib import admin

from .models import Book, BookChapter, BookTestimonial


class ChapterInline(admin.TabularInline):
    model = BookChapter
    extra = 3
    fields = ['number', 'title', 'theme', 'excerpt', 'order']


class TestimonialInline(admin.TabularInline):
    model = BookTestimonial
    extra = 1


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'release_date', 'is_published', 'order']
    list_filter = ['is_published']
    list_editable = ['is_published', 'order']
    fieldsets = (
        ('Book Details', {
            'fields': ('title', 'subtitle', 'description', 'cover_image', 'author', 'publisher', 'page_count', 'isbn'),
        }),
        ('Publication', {
            'fields': ('is_published', 'release_date', 'amazon_url', 'preview_pdf'),
        }),
        ('Pricing', {
            'fields': ('price_kes', 'price_usd'),
        }),
        ("Author's Note", {
            'fields': ('authors_note',),
        }),
    )
    inlines = [ChapterInline, TestimonialInline]


@admin.register(BookChapter)
class BookChapterAdmin(admin.ModelAdmin):
    list_display = ['book', 'number', 'title', 'order']
    list_editable = ['order']
    list_filter = ['book']
    ordering = ['book', 'order']


@admin.register(BookTestimonial)
class BookTestimonialAdmin(admin.ModelAdmin):
    list_display = ['author_name', 'book', 'rating', 'order']
    list_filter = ['book', 'rating']
