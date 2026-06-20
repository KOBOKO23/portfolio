"""
apps/feedback/views.py — Site feedback widget: submit ratings and display approved entries.

Endpoints (under /api/feedback/)
  POST  create/  — submit a feedback rating and optional message
  GET   list/    — approved feedback entries visible on the public site
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import Feedback
from .serializers import FeedbackPublicSerializer, FeedbackSerializer


class FeedbackRateThrottle(AnonRateThrottle):
    scope = 'feedback'


class FeedbackCreateView(generics.CreateAPIView):
    serializer_class = FeedbackSerializer
    throttle_classes = [FeedbackRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Thank you for your feedback!'}, status=status.HTTP_201_CREATED)


class FeedbackListView(generics.ListAPIView):
    serializer_class = FeedbackPublicSerializer
    queryset = Feedback.objects.filter(is_approved=True)
