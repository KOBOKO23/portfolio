from django.urls import path

from . import views

urlpatterns = [
    path('categories/', views.BlogCategoryListView.as_view(), name='blog-categories'),
    path('articles/', views.BlogArticleListView.as_view(), name='blog-articles'),
    path('articles/<slug:slug>/', views.BlogArticleDetailView.as_view(), name='blog-article-detail'),
    path('articles/<slug:slug>/comments/', views.BlogCommentListCreateView.as_view(), name='blog-comments'),
    path('articles/<slug:slug>/like/', views.BlogLikeToggleView.as_view(), name='blog-like'),
    path('articles/<slug:slug>/react/', views.BlogReactionToggleView.as_view(), name='blog-react'),
    path('articles/<slug:slug>/share/<str:platform>/', views.BlogShareRecordView.as_view(), name='blog-share'),
]
