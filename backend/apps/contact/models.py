from django.db import models


class ContactMessage(models.Model):
    SUBJECT_CHOICES = [
        ("general", "General Inquiry"),
        ("callback", "Call-back Request"),
        ("collaboration", "Collaboration"),
        ("project", "Project Inquiry"),
        ("speaking", "Speaking Engagement"),
        ("donation", "Donation / Sponsorship"),
        ("mentorship", "Mentorship — Great Men Moves"),
        ("music", "Gospel Music"),
        ("book", "Book — The Jar You Left Behind"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField()
    # Visitor's own number, for call-back requests. The site owner's number is
    # never published; they call the visitor back instead.
    phone = models.CharField(max_length=30, blank=True)
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES, default="general")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.get_subject_display()}"
