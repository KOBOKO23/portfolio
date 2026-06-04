from rest_framework import generics, status
from rest_framework.response import Response
from .models import Feedback
from .serializers import FeedbackSerializer, FeedbackPublicSerializer


class FeedbackCreateView(generics.CreateAPIView):
    serializer_class = FeedbackSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Thank you for your feedback!'}, status=status.HTTP_201_CREATED)


class FeedbackListView(generics.ListAPIView):
    serializer_class = FeedbackPublicSerializer
    queryset = Feedback.objects.filter(is_approved=True)
