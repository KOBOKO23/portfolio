from rest_framework import serializers

from utils.media import media_url

from .models import Project, ProjectCategory, ProjectImage


class ProjectCategorySerializer(serializers.ModelSerializer):
    project_count = serializers.SerializerMethodField()

    class Meta:
        model = ProjectCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'color', 'project_count']

    def get_project_count(self, obj):
        return obj.project_count


class ProjectImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProjectImage
        fields = ['id', 'image', 'caption', 'order']

    def get_image(self, obj):
        return media_url(self.context.get('request'), obj.image)


class ProjectSerializer(serializers.ModelSerializer):
    category = ProjectCategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()
    gallery = ProjectImageSerializer(many=True, read_only=True, source='images')
    technologies_list = serializers.ReadOnlyField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'description', 'detailed_description',
            'category', 'image', 'gallery', 'technologies', 'technologies_list',
            'github_url', 'live_url', 'year', 'is_featured',
        ]

    def get_image(self, obj):
        return media_url(self.context.get('request'), obj.image)
