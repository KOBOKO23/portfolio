"""
apps/books/views.py — Book listing and per-book testimonials.

Endpoints (under /api/books/)
  GET  books/                    — all books with chapters and approved testimonials
  GET  books/<id>/testimonials/  — approved testimonials for a specific book
  POST books/<id>/testimonials/  — submit a testimonial (held for admin approval)
"""
from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.throttling import AnonRateThrottle

from .models import Book, BookTestimonial
from .serializers import BookSerializer, BookTestimonialCreateSerializer, BookTestimonialSerializer


class BookTestimonialRateThrottle(AnonRateThrottle):
    scope = 'book_testimonial'


class BookListView(generics.ListAPIView):
    serializer_class = BookSerializer

    def get_queryset(self):
        return Book.objects.prefetch_related(
            models.Prefetch(
                'testimonials',
                queryset=BookTestimonial.objects.filter(is_approved=True),
            )
        )


class BookTestimonialListCreateView(generics.ListCreateAPIView):
    pagination_class = None
    throttle_classes = [BookTestimonialRateThrottle]

    def get_serializer_class(self):
        return BookTestimonialCreateSerializer if self.request.method == 'POST' else BookTestimonialSerializer

    def get_queryset(self):
        return BookTestimonial.objects.filter(book_id=self.kwargs['book_id'], is_approved=True)

    def perform_create(self, serializer):
        book = get_object_or_404(Book, pk=self.kwargs['book_id'])
        serializer.save(book=book, is_approved=False)
