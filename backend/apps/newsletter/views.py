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
from .models import NewsletterSubscriber, NewsletterIssue
from .serializers import NewsletterSubscribeSerializer, NewsletterIssueSerializer


class NewsletterSubscribeView(generics.CreateAPIView):
    serializer_class = NewsletterSubscribeSerializer

    def create(self, request, *args, **kwargs):
        # Handle resubscription of inactive subscriber
        email = request.data.get('email', '')
        existing = NewsletterSubscriber.objects.filter(email=email, is_active=False).first()
        if existing:
            existing.is_active = True
            existing.name = request.data.get('name', existing.name)
            existing.save()
            return Response(
                {'message': 'Welcome back! You have been resubscribed.'},
                status=status.HTTP_200_OK,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'message': 'Thank you for subscribing!'},
            status=status.HTTP_201_CREATED,
        )


class NewsletterIssueListView(generics.ListAPIView):
    queryset = NewsletterIssue.objects.all()
    serializer_class = NewsletterIssueSerializer
