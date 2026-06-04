from rest_framework import serializers
from .models import FashionCategory, FashionImage
from utils.media import media_url


class FashionCategorySerializer(serializers.ModelSerializer):
    image_count = serializers.SerializerMethodField()

    class Meta:
        model = FashionCategory
        fields = ['id', 'name', 'slug', 'image_count']

    def get_image_count(self, obj):
        return obj.image_count


class FashionImageSerializer(serializers.ModelSerializer):
    category = FashionCategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = FashionImage
        fields = ['id', 'title', 'image', 'category', 'description', 'location', 'photographer', 'date_taken']

    def get_image(self, obj):
        return media_url(self.context.get('request'), obj.image)
