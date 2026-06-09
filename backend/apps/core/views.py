from django.db import connection
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CareerEvent, Profile, Skill
from .serializers import CareerEventSerializer, ProfileSerializer, SkillSerializer
from .services import get_weather_forecast


class HealthCheckView(APIView):
    def get(self, request):
        try:
            connection.ensure_connection()
            db_ok = True
        except Exception:
            db_ok = False
        status = 200 if db_ok else 503
        return Response({'status': 'ok' if db_ok else 'degraded', 'db': db_ok}, status=status)


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


class CareerEventListView(generics.ListAPIView):
    queryset = CareerEvent.objects.all()
    serializer_class = CareerEventSerializer
    pagination_class = None


class WeatherForecastView(APIView):
    def get(self, request):
        forecast = get_weather_forecast()
        return Response(forecast)
