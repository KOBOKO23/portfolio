"""
apps/contact/views.py — Contact form submission with admin email notification.

Endpoints (under /api/contact/)
  POST  messages/  — create a contact message (rate-limited: 5 requests/hr per IP)
"""

import logging

from django.conf import settings
from django.core.mail import EmailMessage
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import ContactMessage
from .serializers import ContactMessageSerializer

logger = logging.getLogger(__name__)

ADMIN_EMAIL = getattr(settings, "ADMIN_EMAIL", None) or getattr(settings, "EMAIL_HOST_USER", "")


class ContactRateThrottle(AnonRateThrottle):
    scope = "contact"


class ContactCreateView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    throttle_classes = [ContactRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        msg = serializer.save()
        _notify_admin_contact(msg)
        reply = (
            "Thanks! I'll call you back on the number you left, usually within 24 hours."
            if msg.subject == "callback"
            else "Message received! I'll get back to you within 24 hours."
        )
        return Response(
            {"message": reply},
            status=status.HTTP_201_CREATED,
        )


def _notify_admin_contact(msg: ContactMessage) -> None:
    if not ADMIN_EMAIL:
        return
    is_callback = msg.subject == "callback"
    lines = [f"From: {msg.name} <{msg.email}>"]
    if msg.phone:
        lines.append(f"Phone: {msg.phone}")
    lines.append(f"Subject: {msg.get_subject_display()}")
    if is_callback:
        lines.append("")
        lines.append(f">>> Call-back requested: please call {msg.phone}")
    admin_url = (
        f"{settings.BACKEND_URL}/{settings.ADMIN_URL}contact/contactmessage/{msg.pk}/change/"
    )
    try:
        EmailMessage(
            subject=(
                f"[Portfolio] Call-back request — {msg.name}"
                if is_callback
                else f"[Portfolio] New message: {msg.get_subject_display()} — {msg.name}"
            ),
            body="\n".join(lines) + f"\n\n{msg.message}\n\n---\nView in admin: {admin_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[ADMIN_EMAIL],
            reply_to=[msg.email],
        ).send(fail_silently=True)
    except Exception:
        logger.debug("Admin notification email failed", exc_info=True)
