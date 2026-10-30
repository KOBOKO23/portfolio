from django.db import models
from django.utils.text import slugify

from utils.images import is_new_upload, shrink_image


class FashionCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name_plural = "Fashion Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def image_count(self):
        return self.images.count()

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class FashionImage(models.Model):
    title = models.CharField(max_length=200)
    image = models.ImageField(upload_to="fashion/")
    # Generated from ``image`` on upload; the gallery grid loads this instead.
    thumbnail = models.ImageField(upload_to="fashion/thumbs/", blank=True, editable=False)
    category = models.ForeignKey(
        FashionCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="images"
    )
    description = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    photographer = models.CharField(max_length=200, blank=True)
    date_taken = models.DateField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "-date_taken"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if is_new_upload(self.image):
            original = self.image.file
            self.image = shrink_image(original, max_px=2000)
            self.thumbnail = shrink_image(original, max_px=600, quality=78)
        super().save(*args, **kwargs)
