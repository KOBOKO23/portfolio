from django.db import models

from utils.images import is_new_upload, shrink_image


class Profile(models.Model):
    full_name = models.CharField(max_length=200)
    tagline = models.CharField(max_length=300)
    bio = models.TextField()
    profile_image = models.ImageField(upload_to="profile/", blank=True, null=True)
    hero_image = models.ImageField(
        "Home cover photo",
        upload_to="profile/hero/",
        blank=True,
        null=True,
        help_text='Large photo at the top of the home page, beside "Where Science Meets '
        'Purpose". A portrait or landscape photo of you works best; it is resized '
        "automatically. Without one, the home page shows the plain dark design.",
    )
    hero_image_alt = models.CharField(
        "Cover photo description",
        max_length=200,
        blank=True,
        help_text="Short description for screen readers and search engines, e.g. "
        '"Philip in a maroon suit in Nairobi".',
    )
    resume_pdf = models.FileField(upload_to="profile/", blank=True, null=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    location = models.CharField(max_length=200, blank=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    years_experience = models.PositiveIntegerField(default=0)
    projects_completed = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profile"

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        # Enforce singleton: only one profile
        if not self.pk and Profile.objects.exists():
            Profile.objects.all().delete()
        for field in ("profile_image", "hero_image"):
            upload = getattr(self, field)
            if is_new_upload(upload):
                setattr(self, field, shrink_image(upload.file, max_px=2400, quality=84))
        super().save(*args, **kwargs)


class CareerEvent(models.Model):
    year = models.CharField(max_length=50, help_text='e.g. "2024 – Present" or "2019 – 2023"')
    title = models.CharField(max_length=200)
    organization = models.CharField(max_length=200)
    description = models.TextField()
    is_current = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0, help_text="Lower = appears first")

    class Meta:
        ordering = ["order", "-is_current"]

    def __str__(self):
        return f"{self.title} @ {self.organization} ({self.year})"


class Skill(models.Model):
    CATEGORY_CHOICES = [
        ("meteorology", "Meteorology"),
        ("software", "Software Development"),
        ("data_science", "Data Science"),
        ("frontend", "Frontend"),
        ("backend", "Backend"),
        ("devops", "DevOps"),
        ("design", "Design"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    proficiency = models.PositiveSmallIntegerField(default=80, help_text="0-100 percentage")
    icon = models.CharField(max_length=50, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["category", "order", "name"]

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"
