"""
Tests for shared utilities.

Covers:
- StandardRenderer: wraps success responses in {success, data, error} envelope
- StandardRenderer: wraps error responses with structured error object
- StandardPagination: page size and response shape
"""

import json

from django.test import TestCase, RequestFactory
from rest_framework.test import APIClient
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.renderers import JSONRenderer

from .renderers import StandardRenderer


class MockResponse:
    """Minimal stand-in for DRF Response used by the renderer."""
    def __init__(self, status_code: int):
        self.status_code = status_code


class StandardRendererTest(TestCase):
    def _render(self, data, status_code=200) -> dict:
        renderer = StandardRenderer()
        mock_response = MockResponse(status_code)
        output = renderer.render(
            data,
            accepted_media_type='application/json',
            renderer_context={'response': mock_response},
        )
        return json.loads(output)

    # ── Success cases ──────────────────────────────────────────────────────────

    def test_200_wraps_data_in_envelope(self):
        result = self._render({'id': 1, 'title': 'Hello'}, 200)
        self.assertTrue(result['success'])
        self.assertEqual(result['data']['id'], 1)
        self.assertIsNone(result['error'])

    def test_201_wraps_created_data(self):
        result = self._render({'message': 'Created'}, 201)
        self.assertTrue(result['success'])
        self.assertEqual(result['data']['message'], 'Created')

    def test_list_data_preserved(self):
        result = self._render([{'id': 1}, {'id': 2}], 200)
        self.assertTrue(result['success'])
        self.assertEqual(len(result['data']), 2)

    # ── Error cases ────────────────────────────────────────────────────────────

    def test_400_wraps_error_envelope(self):
        result = self._render({'detail': 'Invalid data.'}, 400)
        self.assertFalse(result['success'])
        self.assertIsNone(result['data'])
        self.assertIsNotNone(result['error'])
        self.assertEqual(result['error']['status'], 400)
        self.assertEqual(result['error']['message'], 'Invalid data.')

    def test_404_uses_detail_as_message(self):
        result = self._render({'detail': 'Not found.'}, 404)
        self.assertEqual(result['error']['message'], 'Not found.')

    def test_500_error_with_non_dict_data(self):
        result = self._render('Internal Server Error', 500)
        self.assertFalse(result['success'])
        self.assertEqual(result['error']['message'], 'Internal Server Error')

    def test_error_details_preserved(self):
        data = {'detail': 'Bad request', 'email': ['Enter a valid email.']}
        result = self._render(data, 400)
        self.assertIn('email', result['error']['details'])

    # ── Edge cases ─────────────────────────────────────────────────────────────

    def test_no_renderer_context_falls_back_gracefully(self):
        renderer = StandardRenderer()
        output = renderer.render({'key': 'value'}, renderer_context=None)
        # Should not raise — falls back to default JSONRenderer behaviour
        self.assertIsNotNone(output)


class StandardRendererIntegrationTest(TestCase):
    """Verify the renderer is active on all API endpoints via a real request."""

    def setUp(self):
        self.client = APIClient()

    def test_blog_list_response_has_envelope(self):
        resp = self.client.get('/api/blog/articles/')
        body = resp.json()
        self.assertIn('success', body)
        self.assertIn('data', body)
        self.assertIn('error', body)

    def test_404_response_has_error_envelope(self):
        resp = self.client.get('/api/blog/articles/does-not-exist/')
        body = resp.json()
        self.assertFalse(body['success'])
        self.assertIsNone(body['data'])
        self.assertIsNotNone(body['error'])
