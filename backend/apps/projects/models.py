from django.db import models
from django.utils.text import slugify


class ProjectCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=20, blank=True, help_text='Hex color e.g. #d4a574')

    class Meta:
        verbose_name_plural = 'Project Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def project_count(self):
        return self.projects.count()

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Project(models.Model):
    title = models.CharField(max_length=300)
    slug = models.SlugField(unique=True, max_length=320)
    description = models.TextField()
    detailed_description = models.TextField(blank=True)
    category = models.ForeignKey(
        ProjectCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects'
    )
    image = models.ImageField(upload_to='projects/', blank=True, null=True)
    technologies = models.JSONField(default=list, blank=True, help_text='List of technology names')
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    year = models.PositiveIntegerField(blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-is_featured', 'order', '-year']

    def __str__(self):
        return self.title

    @property
    def technologies_list(self):
        return self.technologies if isinstance(self.technologies, list) else []

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
