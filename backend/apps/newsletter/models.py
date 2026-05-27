from django.db import models


class NewsletterSubscriber(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-subscribed_at']

    def __str__(self):
        return f'{self.name} <{self.email}>'


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
