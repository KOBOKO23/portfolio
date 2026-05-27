from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['rating', 'email', 'page_url', 'created_at']
    list_filter = ['rating']
    readonly_fields = ['created_at']
    search_fields = ['message', 'email']
