from rest_framework import serializers

from .models import PreOrder


class PreOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreOrder
        fields = [
            'id', 'name', 'email', 'phone', 'product_name',
            'amount', 'currency', 'payment_method', 'status',
            'mpesa_receipt_number', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'mpesa_receipt_number', 'created_at']


class MpesaSTKPushSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, help_text='254XXXXXXXXX — no +, no spaces')
    amount = serializers.IntegerField(min_value=1)

    def validate_phone(self, value):
        value = value.strip().replace(' ', '').replace('+', '')
        if value.startswith('0'):
            value = '254' + value[1:]
        if not value.startswith('254') or len(value) != 12:
            raise serializers.ValidationError(
                'Enter a valid Kenyan phone number (07XX or 254XXXXXXXXX)'
            )
        return value


class StripeIntentSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    amount = serializers.IntegerField(min_value=1, help_text='Amount in smallest currency unit (cents/pence)')
    currency = serializers.CharField(max_length=3, default='usd')
