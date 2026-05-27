from rest_framework import serializers
from .models import NewsletterSubscriber, NewsletterIssue


class NewsletterSubscribeSerializer(serializers.ModelSerializer):
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
