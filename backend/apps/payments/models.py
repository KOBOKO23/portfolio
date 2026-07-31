"""
apps/payments/models.py
───────────────────────
Single-model payment layer supporting M-Pesa (Daraja STK Push) and
Stripe (PaymentIntent) pre-orders for the book "The Jar You Left Behind".

PreOrder lifecycle
------------------
pending     → initial state on creation
processing  → STK Push sent / Stripe intent created
paid        → confirmed via Daraja callback (ResultCode=0) or Stripe webhook
failed      → Daraja error / Stripe failure / timeout
cancelled   → manually cancelled by admin

M-Pesa fields are populated after a successful STK Push and filled further
when the Daraja callback fires. Stripe fields are set after PaymentIntent
creation; the client_secret is used by the frontend Elements form.

Note: stripe_client_secret is stored temporarily to allow order-status
polling. It should be cleared after successful payment in a production
cleanup job.
"""
import uuid

from django.db import models


class PreOrder(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('mpesa', 'M-Pesa'),
        ('card', 'Card (Stripe)'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, help_text='E.164 format: 254XXXXXXXXX')
    product_name = models.CharField(max_length=300, default='The Jar You Left Behind — Pre-Order')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')

    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='pending')

    # M-Pesa fields
    mpesa_checkout_request_id = models.CharField(max_length=200, blank=True)
    mpesa_merchant_request_id = models.CharField(max_length=200, blank=True)
    mpesa_receipt_number = models.CharField(max_length=100, blank=True)

    # Stripe fields
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True)
    stripe_client_secret = models.CharField(max_length=500, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.product_name} — {self.name} ({self.status})'
