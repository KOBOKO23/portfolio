"""
apps/newsletter/views.py
────────────────────────
REST API views for newsletter subscription and issue listing.

Endpoints (under /api/newsletter/)
------------------------------------
POST subscribe/            — subscribe a new email; handles resubscription of lapsed subscribers
GET  issues/                — paginated list of published newsletter issues (ordered by number desc)
GET/POST unsubscribe/<token>/ — one-click unsubscribe (RFC 8058), see NewsletterUnsubscribeView

Resubscription
--------------
If the submitted email already exists but is_active=False, the subscriber is
reactivated (name updated if changed) and a 200 OK is returned instead of 201.
A truly new email receives 201 Created.
Duplicate active emails are rejected with 400 (unique constraint on EmailField).
"""
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import NewsletterIssue, NewsletterSubscriber
from .serializers import NewsletterIssueSerializer, NewsletterSubscribeSerializer


class NewsletterRateThrottle(AnonRateThrottle):
    scope = 'newsletter'


class NewsletterSubscribeView(generics.CreateAPIView):
    serializer_class = NewsletterSubscribeSerializer
    throttle_classes = [NewsletterRateThrottle]

    def create(self, request, *args, **kwargs):
        # Validate first — catches missing email, bad format, and active-duplicate
        # (all via the serializer). Inactive-email uniqueness is intentionally allowed
        # through so the resubscription branch below can reactivate the subscriber.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        name = serializer.validated_data.get('name', '')

        existing = NewsletterSubscriber.objects.filter(email=email, is_active=False).first()
        if existing:
            existing.is_active = True
            if name:
                existing.name = name
            existing.save(update_fields=['is_active', 'name'])
            # Unified success message — callers cannot distinguish new from resubscribed
            return Response(
                {'message': 'Thank you for subscribing!'},
                status=status.HTTP_200_OK,
            )

        serializer.save()
        return Response(
            {'message': 'Thank you for subscribing!'},
            status=status.HTTP_201_CREATED,
        )


class NewsletterIssueListView(generics.ListAPIView):
    queryset = NewsletterIssue.objects.all()
    serializer_class = NewsletterIssueSerializer


@method_decorator(csrf_exempt, name='dispatch')
class NewsletterUnsubscribeView(View):
    """
    One-click unsubscribe, keyed by the per-subscriber unsubscribe_token.

    GET  — human clicks the link in an email footer; deactivates immediately
           and shows a plain confirmation page.
    POST — RFC 8058 List-Unsubscribe-Post: mail clients (Gmail, etc.) POST
           here with body `List-Unsubscribe=One-Click` on the user's behalf,
           with no confirmation step and no CSRF token available, hence
           csrf_exempt. Both verbs are idempotent.
    """

    def get(self, request, token):
        subscriber = get_object_or_404(NewsletterSubscriber, unsubscribe_token=token)
        if subscriber.is_active:
            subscriber.is_active = False
            subscriber.save(update_fields=['is_active'])
        return HttpResponse(
            '<!DOCTYPE html><html><head><meta charset="UTF-8">'
            '<title>Unsubscribed</title></head>'
            '<body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center;">'
            f'<h1>You’re unsubscribed</h1>'
            f'<p>{subscriber.email} will no longer receive the newsletter.</p>'
            '</body></html>',
            content_type='text/html; charset=utf-8',
        )

    def post(self, request, token):
        subscriber = get_object_or_404(NewsletterSubscriber, unsubscribe_token=token)
        if subscriber.is_active:
            subscriber.is_active = False
            subscriber.save(update_fields=['is_active'])
        return HttpResponse(status=200)
