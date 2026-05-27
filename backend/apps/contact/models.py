from django.db import models


class ContactMessage(models.Model):
    SUBJECT_CHOICES = [
        ('collaboration', 'Collaboration'),
        ('project', 'Project Inquiry'),
        ('speaking', 'Speaking Engagement'),
        ('general', 'General Inquiry'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES, default='general')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} — {self.get_subject_display()}'
