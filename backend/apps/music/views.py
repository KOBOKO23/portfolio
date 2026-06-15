"""
apps/music/views.py — Music track listing with streaming platform links.

Endpoints (under /api/music/)
  GET  tracks/  — all tracks; supports ?search= across title and description
"""
from rest_framework import filters, generics

from .models import MusicTrack
from .serializers import MusicTrackSerializer


class MusicTrackListView(generics.ListAPIView):
    queryset = MusicTrack.objects.all()
    serializer_class = MusicTrackSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
