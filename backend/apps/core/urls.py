from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.HealthCheckView.as_view(), name='health'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('skills/', views.SkillListView.as_view(), name='skills'),
    path('career/', views.CareerEventListView.as_view(), name='career-events'),
    path('weather/forecast/', views.WeatherForecastView.as_view(), name='weather-forecast'),
]
