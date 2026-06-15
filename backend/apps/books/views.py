"""
apps/books/views.py — Book listing and per-book testimonials.

Endpoints (under /api/books/)
  GET  books/                    — all books with chapters and testimonials
  GET  books/<id>/testimonials/  — testimonials for a specific book
"""
from rest_framework import generics

from .models import Book, BookTestimonial
from .serializers import BookSerializer, BookTestimonialSerializer


class BookListView(generics.ListAPIView):
    queryset = Book.objects.prefetch_related('testimonials')
    serializer_class = BookSerializer


class BookTestimonialListView(generics.ListAPIView):
    serializer_class = BookTestimonialSerializer
    pagination_class = None

    def get_queryset(self):
        return BookTestimonial.objects.filter(book_id=self.kwargs['book_id'])
