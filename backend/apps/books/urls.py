from django.urls import path

from . import views

urlpatterns = [
    path('', views.BookListView.as_view(), name='books'),
    path('<int:book_id>/testimonials/', views.BookTestimonialListCreateView.as_view(), name='book-testimonials'),
]
