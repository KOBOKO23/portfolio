from rest_framework import serializers
from .models import GreatMenProgram, ImpactGoal, VolunteerApplication
from utils.media import media_url


class GreatMenProgramSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = GreatMenProgram
        fields = ['id', 'title', 'date', 'location', 'description', 'spots', 'image']

    def get_image(self, obj):
        return media_url(self.context.get('request'), obj.image)


class ImpactGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImpactGoal
        fields = ['id', 'number', 'label', 'progress', 'icon']


class VolunteerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerApplication
        fields = ['id', 'full_name', 'email', 'phone', 'profession', 'motivation']
