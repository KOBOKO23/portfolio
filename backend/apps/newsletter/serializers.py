"""
apps/newsletter/serializers.py — Newsletter subscriber signup and published issue listing.
"""
from rest_framework import serializers

from .models import NewsletterIssue, NewsletterSubscriber


class NewsletterSubscribeSerializer(serializers.ModelSerializer):
    # Explicit declaration removes the auto-generated UniqueValidator so that
    # inactive subscribers pass validation here and get reactivated in the view.
    # Active-subscriber uniqueness is enforced by validate_email below.
    email = serializers.EmailField()

    class Meta:
        model = NewsletterSubscriber
        fields = ['id', 'name', 'email', 'subscribed_at']
        read_only_fields = ['id', 'subscribed_at']

    def validate_email(self, value):
        if NewsletterSubscriber.objects.filter(email=value, is_active=True).exists():
            raise serializers.ValidationError('This email is already subscribed.')
        return value


class NewsletterIssueSerializer(serializers.ModelSerializer):
    topics_list = serializers.ReadOnlyField()

    class Meta:
        model = NewsletterIssue
        fields = ['id', 'number', 'title', 'excerpt', 'content', 'published_date', 'topics', 'topics_list']
