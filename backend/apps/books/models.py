from django.db import models


class Book(models.Model):
    title = models.CharField(max_length=300)
    subtitle = models.CharField(max_length=300, blank=True)
    description = models.TextField()
    cover_image = models.ImageField(upload_to='books/', blank=True, null=True)
    author = models.CharField(max_length=200, default='Msizi')
    isbn = models.CharField(max_length=20, blank=True)
    page_count = models.PositiveIntegerField(blank=True, null=True)
    release_date = models.DateField(blank=True, null=True)
    publisher = models.CharField(max_length=200, blank=True)
    amazon_url = models.URLField(blank=True)
    preview_pdf = models.FileField(upload_to='books/previews/', blank=True, null=True)
    authors_note = models.TextField(blank=True, help_text="Author's personal note shown on the book page")
    price_kes = models.PositiveIntegerField(default=1500, help_text='Pre-order price in KES')
    price_usd = models.DecimalField(max_digits=6, decimal_places=2, default=9.99, help_text='Pre-order price in USD')
    is_published = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', '-release_date']

    def __str__(self):
        return self.title


class BookChapter(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='chapters')
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    theme = models.CharField(max_length=200, blank=True, help_text='Subtitle / theme of the chapter')
    excerpt = models.TextField(blank=True, help_text='Short preview shown on the book page')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'number']

    def __str__(self):
        return f'Chapter {self.number}: {self.title}'


class BookTestimonial(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='testimonials')
    quote = models.TextField()
    author_name = models.CharField(max_length=200)
    author_title = models.CharField(max_length=200, blank=True)
    author_photo = models.ImageField(upload_to='books/testimonials/', blank=True, null=True)
    rating = models.PositiveSmallIntegerField(default=5)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.author_name} on "{self.book.title}"'
