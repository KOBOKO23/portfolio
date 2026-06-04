from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['rating', 'email', 'message_preview', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_approved']
    readonly_fields = ['created_at']
    search_fields = ['message', 'email']
    actions = ['approve_feedback', 'reject_feedback']

    def message_preview(self, obj):
        return obj.message[:60] + '…' if len(obj.message) > 60 else obj.message
    message_preview.short_description = 'Message'

    def approve_feedback(self, request, queryset):
        queryset.update(is_approved=True)
    approve_feedback.short_description = 'Approve selected feedback'

    def reject_feedback(self, request, queryset):
        queryset.update(is_approved=False)
    reject_feedback.short_description = 'Reject selected feedback'
