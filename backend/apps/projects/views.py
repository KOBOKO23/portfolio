"""
apps/projects/views.py — Portfolio project categories and project listing / detail.

Endpoints (under /api/projects/)
  GET  categories/       — all categories with project counts
  GET  projects/         — project list; supports ?category__slug= ?is_featured= ?year= and ?search=
  GET  projects/<slug>/  — full project detail with gallery images
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics

from .models import Project, ProjectCategory
from .serializers import ProjectCategorySerializer, ProjectSerializer


class ProjectCategoryListView(generics.ListAPIView):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    pagination_class = None


class ProjectListView(generics.ListAPIView):
    queryset = Project.objects.select_related('category')
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'is_featured', 'year']
    search_fields = ['title', 'description']
    ordering_fields = ['year', 'order']


class ProjectDetailView(generics.RetrieveAPIView):
    queryset = Project.objects.select_related('category')
    serializer_class = ProjectSerializer
    lookup_field = 'slug'
