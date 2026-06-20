"""
apps/payments/views.py
──────────────────────
Payment API views for M-Pesa (Daraja) and Stripe pre-orders.

Endpoints (all under /api/payments/)
--------------------------------------
POST mpesa/stk-push/        — initiate M-Pesa STK Push; creates a PreOrder (status=processing)
POST mpesa/callback/        — Daraja server-to-server callback; updates PreOrder status
POST stripe/create-intent/  — create Stripe PaymentIntent; returns client_secret for frontend
POST stripe/webhook/        — Stripe server-to-server event (payment_intent.succeeded/failed)
GET  orders/<uuid>/         — poll PreOrder status (used by frontend after payment)
PATCH orders/<uuid>/        — frontend confirms Stripe success (sets status=paid)

M-Pesa flow
-----------
1. Client POSTs to mpesa/stk-push/ → STK Push sent to phone → PreOrder created
2. User approves on phone → Daraja POSTs to mpesa/callback/ → status updated
3. Frontend polls orders/<uuid>/ every 5 seconds (max 20 attempts) for status change

Stripe flow
-----------
1. Client POSTs to stripe/create-intent/ → PaymentIntent created → client_secret returned
2. Frontend mounts Stripe Elements, submits card details → stripe.confirmCardPayment()
3. On success, frontend PATCHes orders/<uuid>/ or Stripe fires webhook
"""
import logging
import os

import stripe
from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .daraja import stk_push
from .models import PreOrder
from .serializers import MpesaSTKPushSerializer, PreOrderSerializer, StripeIntentSerializer

logger = logging.getLogger(__name__)

stripe.api_key = os.getenv('STRIPE_SECRET_KEY', '')


class PaymentRateThrottle(AnonRateThrottle):
    scope = 'payment'


class MpesaSTKPushView(APIView):
    """Initiate M-Pesa STK Push, create a pending PreOrder."""

    throttle_classes = [PaymentRateThrottle]

    def post(self, request):
        serializer = MpesaSTKPushSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        amount = data['amount']
        phone = data['phone']

        order = PreOrder.objects.create(
            name=data['name'],
            email=data['email'],
            phone=phone,
            amount=amount,
            currency='KES',
            payment_method='mpesa',
            status='processing',
        )

        callback_url = os.getenv(
            'DARAJA_CALLBACK_URL',
            f'{request.build_absolute_uri("/api/payments/mpesa/callback/")}',
        )

        try:
            result = stk_push(
                phone=phone,
                amount=amount,
                account_ref=str(order.id)[:10],
                description='Pre-Order',
                callback_url=callback_url,
            )
            order.mpesa_checkout_request_id = result.get('CheckoutRequestID', '')
            order.mpesa_merchant_request_id = result.get('MerchantRequestID', '')
            order.save(update_fields=['mpesa_checkout_request_id', 'mpesa_merchant_request_id'])

            return Response({
                'order_id': str(order.id),
                'checkout_request_id': order.mpesa_checkout_request_id,
                'message': result.get('CustomerMessage', 'Check your phone to complete payment.'),
            })
        except Exception as exc:
            logger.exception('Daraja STK Push failed: %s', exc)
            order.status = 'failed'
            order.save(update_fields=['status'])
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class MpesaCallbackView(APIView):
    """Receive Daraja STK Push result callback."""

    def _verify_caller_ip(self, request) -> bool:
        """Return True if caller IP is on the Daraja allowlist (or no allowlist configured)."""
        import os
        raw = os.getenv('DARAJA_CALLBACK_IPS', '')
        if not raw:
            return True
        allowed = {ip.strip() for ip in raw.split(',') if ip.strip()}
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
        caller_ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR', '')
        return caller_ip in allowed

    def post(self, request):
        if not self._verify_caller_ip(request):
            logger.warning('Daraja callback rejected: IP not in allowlist')
            return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})

        try:
            body = request.data.get('Body', {})
            stk_callback = body.get('stkCallback', {})
            result_code = stk_callback.get('ResultCode')
            merchant_request_id = stk_callback.get('MerchantRequestID', '')
            checkout_request_id = stk_callback.get('CheckoutRequestID', '')

            # Cross-validate both IDs — protects against fabricated callbacks that
            # only know one of the two identifiers returned at STK push time.
            order = PreOrder.objects.filter(
                mpesa_merchant_request_id=merchant_request_id,
                mpesa_checkout_request_id=checkout_request_id,
                payment_method='mpesa',
            ).first()

            if not order:
                logger.warning(
                    'Daraja callback: no order matched MerchantRequestID=%s CheckoutRequestID=%s',
                    merchant_request_id, checkout_request_id,
                )
                return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})

            # Idempotency: only process while still in processing state
            if order.status != 'processing':
                return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})

            if result_code == 0:
                items = stk_callback.get('CallbackMetadata', {}).get('Item', [])
                receipt = next((i['Value'] for i in items if i.get('Name') == 'MpesaReceiptNumber'), '')
                order.status = 'paid'
                order.mpesa_receipt_number = receipt
            else:
                order.status = 'failed'

            order.save(update_fields=['status', 'mpesa_receipt_number'])
        except Exception as exc:
            logger.exception('Daraja callback processing error: %s', exc)

        return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})


class StripeCreateIntentView(APIView):
    """Create a Stripe PaymentIntent, return client_secret."""

    throttle_classes = [PaymentRateThrottle]

    def post(self, request):
        serializer = StripeIntentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data

        order = PreOrder.objects.create(
            name=data['name'],
            email=data['email'],
            amount=data['amount'] / 100,  # store in base currency unit
            currency=data['currency'].upper(),
            payment_method='card',
            status='processing',
        )

        try:
            intent = stripe.PaymentIntent.create(
                amount=data['amount'],
                currency=data['currency'],
                metadata={
                    'order_id': str(order.id),
                    'customer_name': data['name'],
                    'customer_email': data['email'],
                },
                receipt_email=data['email'],
            )
            order.stripe_payment_intent_id = intent.id
            order.stripe_client_secret = intent.client_secret
            order.save(update_fields=['stripe_payment_intent_id', 'stripe_client_secret'])

            return Response({
                'order_id': str(order.id),
                'client_secret': intent.client_secret,
                'publishable_key': os.getenv('STRIPE_PUBLISHABLE_KEY', ''),
            })
        except stripe.error.StripeError as exc:
            logger.exception('Stripe error: %s', exc)
            order.status = 'failed'
            order.save(update_fields=['status'])
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class StripeWebhookView(APIView):
    """Handle Stripe webhook events (payment_intent.succeeded / failed)."""

    def post(self, request):
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET', '')

        try:
            event = stripe.Webhook.construct_event(
                request.body, sig_header, webhook_secret
            )
        except (ValueError, stripe.error.SignatureVerificationError) as exc:
            return Response({'error': str(exc)}, status=400)

        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object']
            order_id = intent.get('metadata', {}).get('order_id')
            if order_id:
                PreOrder.objects.filter(id=order_id).update(
                    status='paid',
                    stripe_client_secret='',  # clear sensitive credential once payment is done
                )

        elif event['type'] == 'payment_intent.payment_failed':
            intent = event['data']['object']
            order_id = intent.get('metadata', {}).get('order_id')
            if order_id:
                PreOrder.objects.filter(id=order_id).update(status='failed')

        return Response({'received': True})


class OrderStatusView(APIView):
    """Poll order status by ID."""

    def get(self, request, order_id):
        try:
            order = PreOrder.objects.get(id=order_id)
            return Response(PreOrderSerializer(order).data)
        except PreOrder.DoesNotExist:
            return Response({'detail': 'Order not found'}, status=404)

    def patch(self, request, order_id):
        """Frontend confirms Stripe payment — verified server-side against Stripe API."""
        try:
            order = PreOrder.objects.get(id=order_id, payment_method='card')
        except PreOrder.DoesNotExist:
            return Response({'detail': 'Order not found'}, status=404)

        if order.status != 'processing':
            return Response(PreOrderSerializer(order).data)

        if not order.stripe_payment_intent_id:
            return Response({'detail': 'No payment intent on record'}, status=400)

        try:
            intent = stripe.PaymentIntent.retrieve(order.stripe_payment_intent_id)
        except stripe.error.StripeError as exc:
            logger.exception('Stripe retrieve failed during PATCH confirm: %s', exc)
            return Response(
                {'detail': 'Could not verify payment with Stripe'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if intent.status != 'succeeded':
            return Response(
                {'detail': f'Payment not confirmed (status: {intent.status})'},
                status=400,
            )

        order.status = 'paid'
        order.stripe_client_secret = ''
        order.save(update_fields=['status', 'stripe_client_secret'])
        return Response(PreOrderSerializer(order).data)
