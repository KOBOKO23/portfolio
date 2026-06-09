"""
Tests for the payments app.

Covers:
- PreOrder model: UUID primary key, status transitions, string representation
- GET /api/payments/orders/<uuid>/ — status polling endpoint
- PATCH /api/payments/orders/<uuid>/ — confirm Stripe payment from frontend
- MpesaSTKPushView — serializer validation and error handling (Daraja mocked)
- StripeCreateIntentView — Stripe API mocked
"""

import uuid
from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework.test import APIClient

from .models import PreOrder

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_order(**kwargs) -> PreOrder:
    defaults = {
        'name': 'Philip Koboko',
        'email': 'philip@koboko.dev',
        'phone': '254712345678',
        'amount': '1500.00',
        'currency': 'KES',
        'payment_method': 'mpesa',
        'status': 'processing',
    }
    defaults.update(kwargs)
    return PreOrder.objects.create(**defaults)


# ── Model Unit Tests ──────────────────────────────────────────────────────────

class PreOrderModelTest(TestCase):
    def test_primary_key_is_uuid(self):
        order = make_order()
        self.assertIsInstance(order.id, uuid.UUID)

    def test_str_includes_product_name_and_status(self):
        order = make_order(status='paid')
        self.assertIn('paid', str(order).lower())
        self.assertIn('Philip Koboko', str(order))

    def test_default_status_is_pending(self):
        order = PreOrder.objects.create(
            name='Test', email='t@t.com', amount='9.99',
            payment_method='card',
        )
        self.assertEqual(order.status, 'pending')

    def test_all_status_transitions_valid(self):
        order = make_order(status='pending')
        for s in ('processing', 'paid', 'failed', 'cancelled'):
            order.status = s
            order.save()
            order.refresh_from_db()
            self.assertEqual(order.status, s)


# ── API Integration Tests ─────────────────────────────────────────────────────

class OrderStatusAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.order = make_order()

    def test_get_order_status(self):
        resp = self.client.get(f'/api/payments/orders/{self.order.id}/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        # OrderStatusView uses PreOrderSerializer (standard renderer only)
        status_val = data.get('status') or data.get('data', {}).get('status')
        self.assertEqual(status_val, 'processing')

    def test_get_nonexistent_order_returns_404(self):
        fake_id = uuid.uuid4()
        resp = self.client.get(f'/api/payments/orders/{fake_id}/')
        self.assertEqual(resp.status_code, 404)

    def test_patch_confirms_stripe_payment(self):
        stripe_order = make_order(
            payment_method='card',
            status='processing',
            stripe_payment_intent_id='pi_test_123',
        )
        resp = self.client.patch(
            f'/api/payments/orders/{stripe_order.id}/',
            {'status': 'paid'},
            format='json',
        )
        self.assertEqual(resp.status_code, 200)
        stripe_order.refresh_from_db()
        self.assertEqual(stripe_order.status, 'paid')


class MpesaSTKPushAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/payments/mpesa/stk-push/'
        self.valid_payload = {
            'name': 'Philip Koboko',
            'email': 'philip@koboko.dev',
            'phone': '0712345678',
            'amount': 1500,
        }

    @patch('apps.payments.views.stk_push')
    def test_successful_stk_push(self, mock_stk):
        mock_stk.return_value = {
            'CheckoutRequestID': 'ws_CO_123',
            'MerchantRequestID': 'mr_456',
            'CustomerMessage': 'Success. Request accepted for processing.',
        }
        resp = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        inner = body['data'].get('data', body['data'])
        self.assertIn('order_id', inner)
        self.assertEqual(inner['checkout_request_id'], 'ws_CO_123')

    @patch('apps.payments.views.stk_push')
    def test_daraja_failure_returns_502(self, mock_stk):
        mock_stk.side_effect = Exception('Daraja timeout')
        resp = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(resp.status_code, 502)
        order = PreOrder.objects.last()
        self.assertEqual(order.status, 'failed')

    def test_phone_normalisation_07xx_to_254(self):
        with patch('apps.payments.views.stk_push') as mock_stk:
            mock_stk.return_value = {'CheckoutRequestID': 'x', 'MerchantRequestID': 'y', 'CustomerMessage': 'ok'}
            self.client.post(self.url, self.valid_payload, format='json')
            call_kwargs = mock_stk.call_args[1] if mock_stk.call_args.kwargs else {}
            call_args = mock_stk.call_args[0] if mock_stk.call_args.args else []
            # phone passed as positional or keyword arg — check both
            phone = call_kwargs.get('phone', call_args[0] if call_args else '')
            self.assertTrue(phone.startswith('254'), f'Expected 254..., got {phone}')

    def test_invalid_payload_returns_400(self):
        resp = self.client.post(self.url, {'name': '', 'phone': '0712345678'}, format='json')
        self.assertEqual(resp.status_code, 400)


class StripeCreateIntentAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/payments/stripe/create-intent/'
        # amount is in smallest unit (cents): 999 = $9.99
        self.valid_payload = {
            'name': 'Philip Koboko',
            'email': 'philip@koboko.dev',
            'amount': 999,
            'currency': 'usd',
        }

    @patch('apps.payments.views.stripe.PaymentIntent.create')
    def test_creates_payment_intent(self, mock_pi):
        mock_pi.return_value = MagicMock(
            id='pi_test_999',
            client_secret='pi_test_999_secret_abc',
        )
        resp = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(resp.status_code, 200)
        # The view manually constructs {success, data} and the renderer wraps it again.
        # Navigate: resp.json()['data'] -> view's dict -> ['data'] -> inner payload
        body = resp.json()
        inner = body['data'].get('data', body['data'])
        self.assertIn('client_secret', inner)
        self.assertEqual(inner['client_secret'], 'pi_test_999_secret_abc')

    @patch('apps.payments.views.stripe.PaymentIntent.create')
    def test_stripe_error_returns_502(self, mock_pi):
        import stripe as stripe_lib
        mock_pi.side_effect = stripe_lib.StripeError('card_declined')
        resp = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(resp.status_code, 502)
