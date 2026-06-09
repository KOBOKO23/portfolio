"""
Tests for the contact app.

Covers:
- ContactMessage model creation and string representation
- POST /api/contact/ endpoint: success, validation errors, and required fields
"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import ContactMessage


class ContactMessageModelTest(TestCase):
    def test_str_returns_name_and_subject(self):
        msg = ContactMessage.objects.create(
            name='Philip Koboko',
            email='philip@koboko.dev',
            subject='collaboration',
            message='I would like to work together on the weather platform.',
        )
        self.assertIn('Philip Koboko', str(msg))
        self.assertIn('Collaboration', str(msg))

    def test_default_subject_is_general(self):
        msg = ContactMessage.objects.create(
            name='Visitor',
            email='visitor@example.com',
            message='Hello there.',
        )
        self.assertEqual(msg.subject, 'general')

    def test_is_read_defaults_to_false(self):
        msg = ContactMessage.objects.create(
            name='New Sender',
            email='new@example.com',
            message='Testing.',
        )
        self.assertFalse(msg.is_read)


class ContactAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/contact/'
        self.valid_payload = {
            'name': 'Philip Koboko',
            'email': 'philip@koboko.dev',
            'subject': 'collaboration',
            'message': 'I would love to collaborate on the NWP project.',
        }

    def test_submit_contact_form_success(self):
        resp = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_response_contains_confirmation_message(self):
        resp = self.client.post(self.url, self.valid_payload, format='json')
        body = resp.json()
        self.assertIn('message', body['data'])

    def test_missing_name_returns_400(self):
        payload = {**self.valid_payload, 'name': ''}
        resp = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.json()['success'])

    def test_invalid_email_returns_400(self):
        payload = {**self.valid_payload, 'email': 'not-an-email'}
        resp = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_missing_message_returns_400(self):
        payload = {**self.valid_payload, 'message': ''}
        resp = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_message_not_saved_on_validation_failure(self):
        self.client.post(self.url, {'name': '', 'email': 'bad'}, format='json')
        self.assertEqual(ContactMessage.objects.count(), 0)
