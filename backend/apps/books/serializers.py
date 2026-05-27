from rest_framework import serializers
from .models import Book, BookTestimonial


class BookTestimonialSerializer(serializers.ModelSerializer):
    author_photo = serializers.SerializerMethodField()

    class Meta:
        model = BookTestimonial
        fields = ['id', 'quote', 'author_name', 'author_title', 'author_photo', 'rating']

    def get_author_photo(self, obj):
        if obj.author_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.author_photo.url)
        return None


class BookSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()
    preview_pdf = serializers.SerializerMethodField()
    testimonials = BookTestimonialSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'subtitle', 'description', 'cover_image',
            'author', 'isbn', 'page_count', 'release_date', 'publisher',
            'amazon_url', 'preview_pdf', 'testimonials',
        ]

    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
        return None

    def get_preview_pdf(self, obj):
        if obj.preview_pdf:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.preview_pdf.url)
        return None
