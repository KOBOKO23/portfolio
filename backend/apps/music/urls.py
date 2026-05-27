from django.urls import path
from . import views

urlpatterns = [
    path('tracks/', views.MusicTrackListView.as_view(), name='music-tracks'),
]
