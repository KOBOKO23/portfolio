"""
apps/core/serializers.py — Profile bio, skills list, and career timeline events.
"""
from rest_framework import serializers

from utils.media import media_url

from .models import CareerEvent, Profile, Skill


class CareerEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerEvent
        fields = ['id', 'year', 'title', 'organization', 'description', 'is_current', 'order']


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'proficiency', 'icon']


class ProfileSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    resume_pdf    = serializers.SerializerMethodField()
    skills        = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id', 'full_name', 'tagline', 'bio', 'profile_image', 'resume_pdf',
            'email', 'phone', 'location',
            'linkedin_url', 'github_url', 'twitter_url', 'instagram_url',
            'years_experience', 'projects_completed', 'skills',
        ]

    def get_profile_image(self, obj):
        return media_url(self.context.get('request'), obj.profile_image)

    def get_resume_pdf(self, obj):
        return media_url(self.context.get('request'), obj.resume_pdf)

    def get_skills(self, obj):
        from .models import Skill
        return SkillSerializer(Skill.objects.all(), many=True).data
