from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from .models import MusicTrack


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_track(**kwargs) -> MusicTrack:
    defaults = {
        'title': 'Baba Nakushukuru',
        'description': 'A gospel worship track',
        'youtube_url': 'https://youtube.com/watch?v=test',
        'is_featured': False,
        'order': 0,
    }
    defaults.update(kwargs)
    return MusicTrack.objects.create(**defaults)


# ── Model Tests ───────────────────────────────────────────────────────────────

class MusicTrackModelTest(TestCase):
    def test_slug_auto_generated(self):
        t = make_track(title='Baba Nakushukuru')
        self.assertEqual(t.slug, 'baba-nakushukuru')

    def test_slug_not_overwritten_if_set(self):
        t = MusicTrack.objects.create(title='Song', slug='custom-slug', youtube_url='')
        self.assertEqual(t.slug, 'custom-slug')

    def test_str(self):
        t = make_track(title='Mungu Wangu')
        self.assertEqual(str(t), 'Mungu Wangu')

    def test_featured_first_ordering(self):
        make_track(title='Regular', is_featured=False, order=1)
        make_track(title='Featured', is_featured=True, order=2)
        first = MusicTrack.objects.first()
        self.assertEqual(first.title, 'Featured')

    def test_optional_platform_urls(self):
        t = make_track()
        self.assertEqual(t.spotify_url, '')
        self.assertEqual(t.apple_music_url, '')
        self.assertEqual(t.soundcloud_url, '')


# ── API Tests ─────────────────────────────────────────────────────────────────

class MusicTrackAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_empty_list(self):
        res = self.client.get('/api/music/tracks/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_tracks_listed(self):
        make_track(title='Track One')
        make_track(title='Track Two')
        res = self.client.get('/api/music/tracks/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data['results']), 2)

    def test_featured_track_first(self):
        make_track(title='Normal', is_featured=False)
        make_track(title='Featured', is_featured=True)
        res = self.client.get('/api/music/tracks/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['results'][0]['title'], 'Featured')

    def test_search_by_title(self):
        make_track(title='Mungu Wangu')
        make_track(title='Yesu ni Bwana')
        res = self.client.get('/api/music/tracks/?search=Mungu')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [t['title'] for t in res.data['results']]
        self.assertIn('Mungu Wangu', titles)
        self.assertNotIn('Yesu ni Bwana', titles)

    def test_search_by_description(self):
        make_track(title='Song A', description='worship anthem')
        make_track(title='Song B', description='praise declaration')
        res = self.client.get('/api/music/tracks/?search=worship')
        titles = [t['title'] for t in res.data['results']]
        self.assertIn('Song A', titles)
        self.assertNotIn('Song B', titles)

    def test_response_fields(self):
        make_track()
        res = self.client.get('/api/music/tracks/')
        track = res.data['results'][0]
        for field in ['id', 'title', 'slug', 'youtube_url', 'is_featured']:
            self.assertIn(field, track)
