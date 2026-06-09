from django.urls import path

from . import views

urlpatterns = [
    path('programs/', views.GreatMenProgramListView.as_view(), name='gmm-programs'),
    path('impact-goals/', views.ImpactGoalListView.as_view(), name='gmm-impact-goals'),
    path('volunteer/', views.VolunteerApplicationCreateView.as_view(), name='gmm-volunteer'),
]
