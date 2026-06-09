from django.urls import path

from .views import (
    MpesaCallbackView,
    MpesaSTKPushView,
    OrderStatusView,
    StripeCreateIntentView,
    StripeWebhookView,
)

urlpatterns = [
    path('mpesa/stk-push/', MpesaSTKPushView.as_view(), name='mpesa-stk-push'),
    path('mpesa/callback/', MpesaCallbackView.as_view(), name='mpesa-callback'),
    path('stripe/create-intent/', StripeCreateIntentView.as_view(), name='stripe-create-intent'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('orders/<uuid:order_id>/', OrderStatusView.as_view(), name='order-status'),
]
