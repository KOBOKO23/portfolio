from django.urls import path

from . import views

urlpatterns = [
    path('categories/', views.FashionCategoryListView.as_view(), name='fashion-categories'),
    path('images/', views.FashionImageListView.as_view(), name='fashion-images'),
]
