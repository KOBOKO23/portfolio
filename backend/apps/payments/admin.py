from django.contrib import admin

from .models import PreOrder


@admin.register(PreOrder)
class PreOrderAdmin(admin.ModelAdmin):
    list_display = [
        'product_name', 'name', 'email', 'amount', 'currency',
        'payment_method', 'status', 'created_at',
    ]
    list_filter = ['status', 'payment_method', 'currency']
    search_fields = ['name', 'email', 'mpesa_receipt_number', 'stripe_payment_intent_id']
    readonly_fields = [
        'id', 'mpesa_checkout_request_id', 'mpesa_merchant_request_id',
        'stripe_payment_intent_id', 'stripe_client_secret', 'created_at', 'updated_at',
    ]
    ordering = ['-created_at']

    fieldsets = [
        ('Customer', {'fields': ['id', 'name', 'email', 'phone']}),
        ('Order', {'fields': ['product_name', 'amount', 'currency', 'payment_method', 'status']}),
        ('M-Pesa', {'fields': ['mpesa_checkout_request_id', 'mpesa_merchant_request_id', 'mpesa_receipt_number']}),
        ('Stripe', {'fields': ['stripe_payment_intent_id', 'stripe_client_secret']}),
        ('Timestamps', {'fields': ['created_at', 'updated_at']}),
    ]
