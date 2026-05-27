from django.db import models
from django.utils.text import slugify


class MusicTrack(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=220)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='music/', blank=True, null=True)
    youtube_url = models.URLField(blank=True)
    spotify_url = models.URLField(blank=True)
    apple_music_url = models.URLField(blank=True)
    soundcloud_url = models.URLField(blank=True)
    release_date = models.DateField(blank=True, null=True)
    duration = models.CharField(max_length=10, blank=True, help_text='e.g. 3:45')
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-is_featured', 'order', '-release_date']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
