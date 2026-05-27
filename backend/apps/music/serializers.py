from rest_framework import serializers
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
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
        return None
