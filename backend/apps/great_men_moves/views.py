from rest_framework import generics, status
from rest_framework.response import Response
from .models import GreatMenProgram, ImpactGoal, VolunteerApplication
from .serializers import GreatMenProgramSerializer, ImpactGoalSerializer, VolunteerApplicationSerializer


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
        serializer.save()
        return Response(
            {'message': 'Your volunteer application has been received. We\'ll be in touch soon!'},
            status=status.HTTP_201_CREATED,
        )
