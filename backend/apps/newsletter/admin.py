from django.contrib import admin, messages

from .email import send_newsletter_issue
from .models import NewsletterIssue, NewsletterSubscriber


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subscribed_at', 'is_active']
    list_filter = ['is_active']
    readonly_fields = ['subscribed_at']
    search_fields = ['name', 'email']
    actions = ['deactivate_subscribers', 'reactivate_subscribers']

    @admin.action(description='Deactivate selected subscribers')
    def deactivate_subscribers(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} subscriber(s) deactivated.', messages.SUCCESS)

    @admin.action(description='Reactivate selected subscribers')
    def reactivate_subscribers(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} subscriber(s) reactivated.', messages.SUCCESS)


@admin.register(NewsletterIssue)
class NewsletterIssueAdmin(admin.ModelAdmin):
    list_display = ['number', 'title', 'published_date', 'subscriber_count']
    ordering = ['-number']
    actions = ['send_to_subscribers']

    def subscriber_count(self, obj):
        from .models import NewsletterSubscriber
        return NewsletterSubscriber.objects.filter(is_active=True).count()
    subscriber_count.short_description = 'Active Subscribers'

    @admin.action(description='✉️  Send this issue to all active subscribers')
    def send_to_subscribers(self, request, queryset):
        if queryset.count() > 1:
            self.message_user(request, 'Send one issue at a time.', messages.WARNING)
            return
        issue = queryset.first()
        sent, failed = send_newsletter_issue(issue)
        level = messages.SUCCESS if failed == 0 else messages.WARNING
        self.message_user(
            request,
            f'Issue #{issue.number} sent: {sent} delivered, {failed} failed.',
            level,
        )
