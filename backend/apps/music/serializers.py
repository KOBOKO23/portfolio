"""
apps/music/serializers.py — Music track data including streaming platform links and cover art.
"""
from rest_framework import serializers

from utils.media import media_url

from .models import MusicTrack


class MusicTrackSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = MusicTrack
        fields = [
            'id', 'title', 'slug', 'description', 'cover_image',
            'youtube_url', 'spotify_url', 'apple_music_url', 'soundcloud_url',
            'release_date', 'duration', 'is_featured',
        ]

    def get_cover_image(self, obj):
        return media_url(self.context.get('request'), obj.cover_image)
