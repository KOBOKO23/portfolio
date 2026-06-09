from django.urls import path

from . import views

urlpatterns = [
    path('categories/', views.ProjectCategoryListView.as_view(), name='project-categories'),
    path('', views.ProjectListView.as_view(), name='projects'),
    path('<slug:slug>/', views.ProjectDetailView.as_view(), name='project-detail'),
]
