from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('skills/', views.SkillListView.as_view(), name='skills'),
    path('weather/forecast/', views.WeatherForecastView.as_view(), name='weather-forecast'),
]
