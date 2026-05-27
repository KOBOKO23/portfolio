"""
apps/contact/views.py
─────────────────────
Single endpoint for the contact form.

POST /api/contact/
    Accepts: name, email, subject (optional), message
    Returns: 201 with confirmation message on success; 400 on validation errors
    Side-effect: creates a ContactMessage record (visible in admin for triage)
    Email delivery: handled separately via admin action or future automation.
"""
from rest_framework import generics, status
from rest_framework.response import Response
from .models import ContactMessage
from .serializers import ContactMessageSerializer


class ContactCreateView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'message': 'Message received! I\'ll get back to you within 24 hours.'},
            status=status.HTTP_201_CREATED,
        )
