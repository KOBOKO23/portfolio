from django.contrib import admin
from .models import MusicTrack


@admin.register(MusicTrack)
class MusicTrackAdmin(admin.ModelAdmin):
    list_display = ['title', 'release_date', 'duration', 'is_featured', 'order']
    list_filter = ['is_featured']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ['is_featured', 'order']
