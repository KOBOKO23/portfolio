"""
apps/newsletter/views.py
────────────────────────
REST API views for newsletter subscription and issue listing.

Endpoints (under /api/newsletter/)
------------------------------------
POST subscribe/   — subscribe a new email; handles resubscription of lapsed subscribers
GET  issues/      — paginated list of published newsletter issues (ordered by number desc)

Resubscription
--------------
If the submitted email already exists but is_active=False, the subscriber is
reactivated (name updated if changed) and a 200 OK is returned instead of 201.
A truly new email receives 201 Created.
Duplicate active emails are rejected with 400 (unique constraint on EmailField).
"""
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
