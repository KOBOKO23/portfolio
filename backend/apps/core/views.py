from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Profile, Skill
from .serializers import ProfileSerializer, SkillSerializer
from .services import get_weather_forecast


class ProfileView(APIView):
    def get(self, request):
        profile = Profile.objects.first()
        if not profile:
            return Response({'detail': 'Profile not configured yet.'}, status=404)
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)


class SkillListView(generics.ListAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    pagination_class = None


class WeatherForecastView(APIView):
    def get(self, request):
        forecast = get_weather_forecast()
        return Response(forecast)
