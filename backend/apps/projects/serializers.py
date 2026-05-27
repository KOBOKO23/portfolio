from rest_framework import serializers
from .models import ProjectCategory, Project


class ProjectCategorySerializer(serializers.ModelSerializer):
    project_count = serializers.SerializerMethodField()

    class Meta:
        model = ProjectCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'color', 'project_count']

    def get_project_count(self, obj):
        return obj.project_count


class ProjectSerializer(serializers.ModelSerializer):
    category = ProjectCategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()
    technologies_list = serializers.ReadOnlyField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'description', 'detailed_description',
            'category', 'image', 'technologies', 'technologies_list',
            'github_url', 'live_url', 'year', 'is_featured',
        ]

    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None
