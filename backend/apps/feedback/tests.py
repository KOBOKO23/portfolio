from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Feedback

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_feedback(**kwargs) -> Feedback:
    defaults = {
        'rating': 5,
        'message': 'Incredible portfolio — very inspiring work.',
        'email': 'visitor@example.com',
        'page_url': '/projects',
        'is_approved': True,
    }
    defaults.update(kwargs)
    return Feedback.objects.create(**defaults)


# ── Model Tests ───────────────────────────────────────────────────────────────

class FeedbackModelTest(TestCase):
    def test_str(self):
        fb = make_feedback(rating=4)
        self.assertIn('4/5', str(fb))

    def test_default_not_approved(self):
        fb = Feedback.objects.create(rating=3, message='Good site.')
        self.assertFalse(fb.is_approved)

    def test_rating_choices(self):
        for r in range(1, 6):
            fb = Feedback.objects.create(rating=r, message=f'Rating {r}')
            self.assertEqual(fb.rating, r)

    def test_ordering_newest_first(self):
        make_feedback(message='First')
        fb2 = make_feedback(message='Second')
        newest = Feedback.objects.first()
        self.assertEqual(newest.pk, fb2.pk)


# ── API Tests ─────────────────────────────────────────────────────────────────

class FeedbackCreateAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/feedback/'

    def test_valid_submission_returns_201(self):
        res = self.client.post(self.url, {'rating': 5, 'message': 'Outstanding!'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Feedback.objects.count(), 1)

    def test_feedback_not_auto_approved(self):
        self.client.post(self.url, {'rating': 4, 'message': 'Looks good.'}, format='json')
        fb = Feedback.objects.first()
        self.assertFalse(fb.is_approved)

    def test_optional_fields_accepted(self):
        payload = {
            'rating': 5,
            'message': 'Great!',
            'email': 'user@example.com',
            'page_url': '/blog',
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        fb = Feedback.objects.first()
        self.assertEqual(fb.email, 'user@example.com')
        self.assertEqual(fb.page_url, '/blog')

    def test_missing_rating_returns_400(self):
        res = self.client.post(self.url, {'message': 'No rating.'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_message_returns_400(self):
        res = self.client.post(self.url, {'rating': 3}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rating_out_of_range_returns_400(self):
        res = self.client.post(self.url, {'rating': 6, 'message': 'Too high.'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_email_returns_400(self):
        res = self.client.post(self.url, {'rating': 5, 'message': 'Hi', 'email': 'bad-email'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class FeedbackApprovedListAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/feedback/approved/'

    def test_empty_list(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_only_approved_feedback_returned(self):
        make_feedback(message='Approved one', is_approved=True)
        make_feedback(message='Pending review', is_approved=False)
        res = self.client.get(self.url)
        messages = [f['message'] for f in res.data['results']]
        self.assertIn('Approved one', messages)
        self.assertNotIn('Pending review', messages)

    def test_public_serializer_excludes_email(self):
        make_feedback(email='secret@example.com', is_approved=True)
        res = self.client.get(self.url)
        item = res.data['results'][0]
        self.assertNotIn('email', item)
        self.assertNotIn('page_url', item)

    def test_response_fields(self):
        make_feedback(is_approved=True)
        res = self.client.get(self.url)
        item = res.data['results'][0]
        for field in ['id', 'rating', 'message', 'created_at']:
            self.assertIn(field, item)
