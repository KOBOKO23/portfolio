from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import FashionCategory, FashionImage
from .serializers import FashionCategorySerializer, FashionImageSerializer


class FashionCategoryListView(generics.ListAPIView):
    queryset = FashionCategory.objects.all()
    serializer_class = FashionCategorySerializer
    pagination_class = None


class FashionImageListView(generics.ListAPIView):
    queryset = FashionImage.objects.select_related('category')
    serializer_class = FashionImageSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category__slug']
    search_fields = ['title', 'description', 'location']
