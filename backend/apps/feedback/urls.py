from django.urls import path

from . import views

urlpatterns = [
    path('', views.FeedbackCreateView.as_view(), name='feedback-create'),
    path('approved/', views.FeedbackListView.as_view(), name='feedback-approved'),
]
