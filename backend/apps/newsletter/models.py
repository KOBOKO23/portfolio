import secrets

from django.db import models


class NewsletterSubscriber(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    unsubscribe_token = models.CharField(max_length=64, unique=True, blank=True)

    class Meta:
        ordering = ['-subscribed_at']

    def __str__(self):
        return f'{self.name} <{self.email}>'

    def save(self, *args, **kwargs):
        if not self.unsubscribe_token:
            self.unsubscribe_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)


class NewsletterIssue(models.Model):
    number = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=300)
    excerpt = models.TextField()
    content = models.TextField(blank=True)
    published_date = models.DateField()
    topics = models.JSONField(default=list, help_text='List of topic strings')

    class Meta:
        ordering = ['-number']

    def __str__(self):
        return f'#{self.number}: {self.title}'

    @property
    def topics_list(self):
        return self.topics if isinstance(self.topics, list) else []
