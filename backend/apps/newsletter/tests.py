"""
Tests for the newsletter app.

Covers:
- NewsletterSubscriber model creation and uniqueness
- NewsletterIssue model and topics_list property
- POST /api/newsletter/subscribe/ — new subscriber, duplicate, and resubscription
- GET /api/newsletter/issues/ — paginated listing
"""

from datetime import date

from django.core.cache import cache
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import NewsletterIssue, NewsletterSubscriber

# ── Model Tests ───────────────────────────────────────────────────────────────

class NewsletterSubscriberModelTest(TestCase):
    def test_str_returns_name_and_email(self):
        sub = NewsletterSubscriber.objects.create(name='Philip', email='p@koboko.dev')
        self.assertIn('Philip', str(sub))
        self.assertIn('p@koboko.dev', str(sub))

    def test_is_active_defaults_to_true(self):
        sub = NewsletterSubscriber.objects.create(name='Alice', email='alice@test.com')
        self.assertTrue(sub.is_active)

    def test_email_is_unique(self):
        NewsletterSubscriber.objects.create(name='First', email='dup@test.com')
        with self.assertRaises(Exception):
            NewsletterSubscriber.objects.create(name='Second', email='dup@test.com')

    def test_unsubscribe_token_is_auto_generated(self):
        sub = NewsletterSubscriber.objects.create(name='Alice', email='token@test.com')
        self.assertTrue(sub.unsubscribe_token)

    def test_unsubscribe_tokens_are_unique_per_subscriber(self):
        sub1 = NewsletterSubscriber.objects.create(name='A', email='a@test.com')
        sub2 = NewsletterSubscriber.objects.create(name='B', email='b@test.com')
        self.assertNotEqual(sub1.unsubscribe_token, sub2.unsubscribe_token)


class NewsletterIssueModelTest(TestCase):
    def test_str_includes_number_and_title(self):
        issue = NewsletterIssue.objects.create(
            number=1, title='Welcome Issue',
            excerpt='First ever issue.', published_date=date.today(),
            topics=['meteorology', 'django'],
        )
        self.assertIn('#1', str(issue))
        self.assertIn('Welcome Issue', str(issue))

    def test_topics_list_property(self):
        issue = NewsletterIssue.objects.create(
            number=2, title='Tech Edition',
            excerpt='Tech stuff.', published_date=date.today(),
            topics=['python', 'docker'],
        )
        self.assertEqual(issue.topics_list, ['python', 'docker'])

    def test_topics_list_fallback_on_non_list(self):
        issue = NewsletterIssue(topics='not-a-list')
        self.assertEqual(issue.topics_list, [])


# ── API Tests ─────────────────────────────────────────────────────────────────

class NewsletterSubscribeAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/newsletter/subscribe/'
        cache.clear()  # Reset DRF throttle counters so tests don't bleed rate-limit state

    def test_subscribe_new_email(self):
        resp = self.client.post(self.url, {'name': 'Alice', 'email': 'alice@test.com'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)

    def test_response_contains_success_message(self):
        resp = self.client.post(self.url, {'name': 'Bob', 'email': 'bob@test.com'}, format='json')
        body = resp.json()
        self.assertIn('message', body['data'])

    def test_duplicate_active_email_returns_400(self):
        NewsletterSubscriber.objects.create(name='Alice', email='alice@test.com', is_active=True)
        resp = self.client.post(self.url, {'name': 'Alice Again', 'email': 'alice@test.com'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resubscribe_inactive_user_returns_200(self):
        NewsletterSubscriber.objects.create(name='Alice', email='alice@test.com', is_active=False)
        resp = self.client.post(self.url, {'name': 'Alice', 'email': 'alice@test.com'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        sub = NewsletterSubscriber.objects.get(email='alice@test.com')
        self.assertTrue(sub.is_active)

    def test_resubscribe_updates_name(self):
        NewsletterSubscriber.objects.create(name='Old Name', email='n@test.com', is_active=False)
        self.client.post(self.url, {'name': 'New Name', 'email': 'n@test.com'}, format='json')
        sub = NewsletterSubscriber.objects.get(email='n@test.com')
        self.assertEqual(sub.name, 'New Name')

    def test_missing_email_returns_400(self):
        resp = self.client.post(self.url, {'name': 'Nobody'}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_invalid_email_format_returns_400(self):
        resp = self.client.post(self.url, {'name': 'X', 'email': 'notanemail'}, format='json')
        self.assertEqual(resp.status_code, 400)


class NewsletterIssuesAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        NewsletterIssue.objects.create(
            number=1, title='First Issue', excerpt='First.',
            published_date=date(2026, 1, 1), topics=['python'],
        )
        NewsletterIssue.objects.create(
            number=2, title='Second Issue', excerpt='Second.',
            published_date=date(2026, 2, 1), topics=['django', 'meteorology'],
        )

    def test_list_issues(self):
        resp = self.client.get('/api/newsletter/issues/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        results = data.get('results', data)
        self.assertEqual(len(results), 2)

    def test_issues_ordered_by_number_descending(self):
        resp = self.client.get('/api/newsletter/issues/')
        results = resp.json()['data'].get('results', resp.json()['data'])
        self.assertEqual(results[0]['number'], 2)


class NewsletterUnsubscribeAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.sub = NewsletterSubscriber.objects.create(name='Alice', email='alice@test.com', is_active=True)
        self.url = f'/api/newsletter/unsubscribe/{self.sub.unsubscribe_token}/'

    def test_get_deactivates_subscriber(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.sub.refresh_from_db()
        self.assertFalse(self.sub.is_active)

    def test_post_deactivates_subscriber(self):
        resp = self.client.post(self.url, data='List-Unsubscribe=One-Click', content_type='text/plain')
        self.assertEqual(resp.status_code, 200)
        self.sub.refresh_from_db()
        self.assertFalse(self.sub.is_active)

    def test_get_is_idempotent(self):
        self.client.get(self.url)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.sub.refresh_from_db()
        self.assertFalse(self.sub.is_active)

    def test_unknown_token_returns_404(self):
        resp = self.client.get('/api/newsletter/unsubscribe/does-not-exist/')
        self.assertEqual(resp.status_code, 404)
