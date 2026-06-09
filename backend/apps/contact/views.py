import logging

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import generics, status
from rest_framework.response import Response

from .models import ContactMessage
from .serializers import ContactMessageSerializer

logger = logging.getLogger(__name__)

ADMIN_EMAIL = getattr(settings, 'ADMIN_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', '')


class ContactCreateView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        msg = serializer.save()
        _notify_admin_contact(msg)
        return Response(
            {'message': "Message received! I'll get back to you within 24 hours."},
            status=status.HTTP_201_CREATED,
        )


def _notify_admin_contact(msg: ContactMessage) -> None:
    if not ADMIN_EMAIL:
        return
    try:
        send_mail(
            subject=f'[Portfolio] New message: {msg.get_subject_display()} — {msg.name}',
            message=(
                f'From: {msg.name} <{msg.email}>\n'
                f'Subject: {msg.get_subject_display()}\n\n'
                f'{msg.message}\n\n'
                f'---\nView in admin: {settings.SITE_URL}/admin/contact/contactmessage/{msg.pk}/change/'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[ADMIN_EMAIL],
            fail_silently=True,
        )
    except Exception:
        logger.debug('Admin notification email failed', exc_info=True)
