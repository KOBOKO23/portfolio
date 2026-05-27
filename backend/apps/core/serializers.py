from rest_framework import serializers
from .models import Profile, Skill


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'proficiency', 'icon']


class ProfileSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    resume_pdf = serializers.SerializerMethodField()
    skills = SkillSerializer(many=True, read_only=True, source='_skills')

    class Meta:
        model = Profile
        fields = [
            'id', 'full_name', 'tagline', 'bio', 'profile_image', 'resume_pdf',
            'linkedin_url', 'github_url', 'twitter_url', 'instagram_url',
            'years_experience', 'projects_completed', 'skills',
        ]

    def get_profile_image(self, obj):
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
        return None

    def get_resume_pdf(self, obj):
        if obj.resume_pdf:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume_pdf.url)
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        from .models import Skill as SkillModel
        skills = SkillModel.objects.all()
        ret['skills'] = SkillSerializer(skills, many=True).data
        return ret
