"""
apps/payments/serializers.py — PreOrder read serializer, M-Pesa STK Push input, and Stripe PaymentIntent input.
"""

from rest_framework import serializers

from .models import PreOrder


class PreOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreOrder
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "product_name",
            "amount",
            "currency",
            "payment_method",
            "status",
            "mpesa_receipt_number",
            "created_at",
        ]
        read_only_fields = ["id", "status", "mpesa_receipt_number", "created_at"]


class OrderStatusSerializer(serializers.ModelSerializer):
    """Public order lookup: payment progress only, none of the buyer's details."""

    class Meta:
        model = PreOrder
        fields = ["id", "product_name", "amount", "currency", "payment_method", "status"]
        read_only_fields = fields


class MpesaSTKPushSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, help_text="254XXXXXXXXX — no +, no spaces")
    # Accepted for backwards compatibility but ignored: the price comes from the Book.
    amount = serializers.IntegerField(required=False)

    def validate_phone(self, value):
        value = value.strip().replace(" ", "").replace("+", "")
        if value.startswith("0"):
            value = "254" + value[1:]
        if not value.startswith("254") or len(value) != 12:
            raise serializers.ValidationError(
                "Enter a valid Kenyan phone number (07XX or 254XXXXXXXXX)"
            )
        return value


class StripeIntentSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    # Accepted for backwards compatibility but ignored: the price comes from the Book.
    amount = serializers.IntegerField(required=False)
    currency = serializers.CharField(max_length=3, required=False)
