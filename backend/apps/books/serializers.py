"""
apps/books/serializers.py — Book details, chapters, and reader testimonials.
"""
from rest_framework import serializers

from utils.media import media_url

from .models import Book, BookChapter, BookTestimonial


class BookTestimonialSerializer(serializers.ModelSerializer):
    author_photo = serializers.SerializerMethodField()

    class Meta:
        model = BookTestimonial
        fields = ['id', 'quote', 'author_name', 'author_title', 'author_photo', 'rating']

    def get_author_photo(self, obj):
        return media_url(self.context.get('request'), obj.author_photo)


class BookTestimonialCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookTestimonial
        fields = ['quote', 'author_name', 'author_title', 'email', 'rating']
        extra_kwargs = {
            'rating': {'min_value': 1, 'max_value': 5},
        }


class BookChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookChapter
        fields = ['id', 'number', 'title', 'theme', 'excerpt', 'order']


class BookSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()
    preview_pdf = serializers.SerializerMethodField()
    testimonials = BookTestimonialSerializer(many=True, read_only=True)
    chapters = BookChapterSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'subtitle', 'description', 'cover_image',
            'author', 'isbn', 'page_count', 'release_date', 'publisher',
            'amazon_url', 'preview_pdf', 'authors_note', 'price_kes', 'price_usd',
            'is_published', 'testimonials', 'chapters',
        ]

    def get_cover_image(self, obj):
        return media_url(self.context.get('request'), obj.cover_image)

    def get_preview_pdf(self, obj):
        return media_url(self.context.get('request'), obj.preview_pdf)
