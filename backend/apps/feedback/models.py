from django.db import models


class Feedback(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    message = models.TextField()
    email = models.EmailField(blank=True)
    page_url = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Feedback {self.rating}/5 — {self.created_at.date()}'
