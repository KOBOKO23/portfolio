from rest_framework import serializers
from .models import GreatMenProgram, ImpactGoal, VolunteerApplication


class GreatMenProgramSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = GreatMenProgram
        fields = ['id', 'title', 'date', 'location', 'description', 'spots', 'image']

    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class ImpactGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImpactGoal
        fields = ['id', 'number', 'label', 'progress', 'icon']


class VolunteerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerApplication
        fields = ['id', 'full_name', 'email', 'phone', 'profession', 'motivation']
