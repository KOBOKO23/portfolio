from django.contrib import admin

from .models import FashionCategory, FashionImage


@admin.register(FashionCategory)
class FashionCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'image_count']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(FashionImage)
class FashionImageAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'location', 'date_taken', 'order']
    list_filter = ['category']
    list_editable = ['order']
    search_fields = ['title', 'description', 'location']
