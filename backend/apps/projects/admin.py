from django.contrib import admin

from .models import Project, ProjectCategory, ProjectImage


@admin.register(ProjectCategory)
class ProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'color', 'project_count']
    prepopulated_fields = {'slug': ('name',)}


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 3
    fields = ['image', 'caption', 'order']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'year', 'is_featured', 'order']
    list_filter = ['category', 'is_featured', 'year']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ['is_featured', 'order']
    inlines = [ProjectImageInline]
