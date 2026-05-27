from django.db import models


class Profile(models.Model):
    full_name = models.CharField(max_length=200)
    tagline = models.CharField(max_length=300)
    bio = models.TextField()
    profile_image = models.ImageField(upload_to='profile/', blank=True, null=True)
    resume_pdf = models.FileField(upload_to='profile/', blank=True, null=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    years_experience = models.PositiveIntegerField(default=0)
    projects_completed = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Profile'
        verbose_name_plural = 'Profile'

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        # Enforce singleton: only one profile
        if not self.pk and Profile.objects.exists():
            Profile.objects.all().delete()
        super().save(*args, **kwargs)


class Skill(models.Model):
    CATEGORY_CHOICES = [
        ('frontend', 'Frontend'),
        ('backend', 'Backend'),
        ('devops', 'DevOps'),
        ('design', 'Design'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    proficiency = models.PositiveSmallIntegerField(default=80, help_text='0-100 percentage')
    icon = models.CharField(max_length=50, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['category', 'order', 'name']

    def __str__(self):
        return f'{self.name} ({self.get_category_display()})'
