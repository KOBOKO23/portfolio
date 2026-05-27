from rest_framework import generics, filters
from .models import MusicTrack
from .serializers import MusicTrackSerializer


class MusicTrackListView(generics.ListAPIView):
    queryset = MusicTrack.objects.all()
    serializer_class = MusicTrackSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
