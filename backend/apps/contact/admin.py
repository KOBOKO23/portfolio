from django.contrib import admin

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'created_at', 'is_read']
    list_filter = ['subject', 'is_read']
    list_editable = ['is_read']
    readonly_fields = ['created_at']
    search_fields = ['name', 'email', 'message']
