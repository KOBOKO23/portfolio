from django.contrib import admin
from .models import Book, BookTestimonial


class TestimonialInline(admin.TabularInline):
    model = BookTestimonial
    extra = 1


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'release_date', 'is_published', 'order']
    list_filter = ['is_published']
    list_editable = ['is_published', 'order']
    inlines = [TestimonialInline]


@admin.register(BookTestimonial)
class BookTestimonialAdmin(admin.ModelAdmin):
    list_display = ['author_name', 'book', 'rating', 'order']
    list_filter = ['book', 'rating']
