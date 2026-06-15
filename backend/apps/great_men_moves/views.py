"""
apps/great_men_moves/views.py — Great Men Moves programme listings and volunteer applications.

Endpoints (under /api/great-men-moves/)
  GET   programs/   — active programmes
  GET   goals/      — impact goals with progress percentages
  POST  volunteer/  — submit a volunteer application (triggers admin notification email)
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import generics, status
from rest_framework.response import Response

from .models import GreatMenProgram, ImpactGoal, VolunteerApplication
from .serializers import (
    GreatMenProgramSerializer,
    ImpactGoalSerializer,
    VolunteerApplicationSerializer,
)

logger = logging.getLogger(__name__)

ADMIN_EMAIL = getattr(settings, 'ADMIN_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', '')


class GreatMenProgramListView(generics.ListAPIView):
    queryset = GreatMenProgram.objects.filter(is_active=True)
    serializer_class = GreatMenProgramSerializer
    pagination_class = None


class ImpactGoalListView(generics.ListAPIView):
    queryset = ImpactGoal.objects.all()
    serializer_class = ImpactGoalSerializer
    pagination_class = None


class VolunteerApplicationCreateView(generics.CreateAPIView):
    serializer_class = VolunteerApplicationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        app = serializer.save()
        _notify_admin_volunteer(app)
        return Response(
            {'message': "Your volunteer application has been received. We'll be in touch soon!"},
            status=status.HTTP_201_CREATED,
        )


def _notify_admin_volunteer(app: VolunteerApplication) -> None:
    if not ADMIN_EMAIL:
        return
    try:
        send_mail(
            subject=f'[GMM] New volunteer application — {app.full_name}',
            message=(
                f'Name: {app.full_name}\n'
                f'Email: {app.email}\n'
                f'Phone: {app.phone or "—"}\n\n'
                f'View in admin: {settings.SITE_URL}/admin/great_men_moves/volunteerapplication/{app.pk}/change/'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[ADMIN_EMAIL],
            fail_silently=True,
        )
    except Exception:
        logger.debug('Volunteer notification email failed', exc_info=True)
