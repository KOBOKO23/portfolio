"""
apps/blog/views.py
──────────────────
REST API views for the blog feature.

Endpoints (all under /api/blog/)
---------------------------------
GET  categories/                   — list all categories (no pagination)
GET  articles/                     — paginated article list; supports ?search=, ?category__slug=, ?is_featured=
GET  articles/<slug>/              — full article detail; increments view count on each retrieval
GET  articles/<slug>/comments/     — top-level approved comments with nested replies
POST articles/<slug>/comments/     — create a new comment (blocked if article.allow_comments=False)
POST articles/<slug>/like/         — toggle like (X-Fingerprint header identifies the user)
POST articles/<slug>/react/        — add/swap/remove emoji reaction (body: {"reaction": "fire"})
POST articles/<slug>/share/<platform>/ — increment share counter for twitter|facebook|linkedin|whatsapp|copy_link

Authentication: none — all endpoints are public.
Rate limiting: inherits project-wide DRF throttle (200 req/hr anon).
"""
from django.db.models import F
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BlogArticle, BlogCategory, BlogComment, BlogLike, BlogReaction, BlogShareCount
from .serializers import (
    BlogArticleDetailSerializer,
    BlogArticleListSerializer,
    BlogCategorySerializer,
    BlogCommentCreateSerializer,
    BlogCommentSerializer,
)


def _get_fingerprint(request):
    return (
        request.META.get('HTTP_X_FINGERPRINT', '')
        or request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
        or request.META.get('REMOTE_ADDR', '')
    )


def _get_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    return x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR', '')


class BlogCategoryListView(generics.ListAPIView):
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    pagination_class = None


class BlogArticleListView(generics.ListAPIView):
    queryset = BlogArticle.objects.filter(is_published=True).select_related('category')
    serializer_class = BlogArticleListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'is_featured', 'language']
    search_fields = ['title', 'excerpt', 'content', 'author', 'tags']
    ordering_fields = ['published_date', 'views', 'read_time']


class BlogArticleDetailView(generics.RetrieveAPIView):
    queryset = (
        BlogArticle.objects
        .filter(is_published=True)
        .select_related('category')
        .prefetch_related('share_counts', 'likes', 'reactions', 'images')
    )
    serializer_class = BlogArticleDetailSerializer
    lookup_field = 'slug'

    def get_object(self):
        obj = super().get_object()
        BlogArticle.objects.filter(pk=obj.pk).update(views=F('views') + 1)
        return obj


class BlogCommentListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BlogCommentCreateSerializer
        return BlogCommentSerializer

    def get_queryset(self):
        article = get_object_or_404(BlogArticle, slug=self.kwargs['slug'], is_published=True)
        return (
            BlogComment.objects
            .filter(article=article, is_approved=True, parent=None)
            .prefetch_related('replies')
        )

    def perform_create(self, serializer):
        article = get_object_or_404(BlogArticle, slug=self.kwargs['slug'], is_published=True)
        parent = serializer.validated_data.get('parent')
        if parent is not None and parent.article_id != article.pk:
            raise serializers.ValidationError(
                {'parent': 'Parent comment does not belong to this article.'}
            )
        ip = _get_ip(self.request)
        serializer.save(article=article, ip_address=ip)

    def create(self, request, *args, **kwargs):
        article = get_object_or_404(BlogArticle, slug=kwargs['slug'], is_published=True)
        if not article.allow_comments:
            return Response(
                {'detail': 'Comments are disabled for this article.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)


class BlogLikeToggleView(APIView):
    def post(self, request, slug):
        article = get_object_or_404(BlogArticle, slug=slug, is_published=True)
        fp = _get_fingerprint(request)
        ip = _get_ip(request)
        existing = BlogLike.objects.filter(article=article, fingerprint=fp).first()
        if existing:
            existing.delete()
            liked = False
        else:
            BlogLike.objects.create(article=article, fingerprint=fp, ip_address=ip)
            liked = True
        return Response({'liked': liked, 'count': article.likes.count()})


class BlogReactionToggleView(APIView):
    def post(self, request, slug):
        article = get_object_or_404(BlogArticle, slug=slug, is_published=True)
        fp = _get_fingerprint(request)
        ip = _get_ip(request)
        reaction_type = request.data.get('reaction')
        valid_types = [r[0] for r in BlogReaction._meta.get_field('reaction').choices]
        if reaction_type not in valid_types:
            return Response({'detail': 'Invalid reaction type.'}, status=status.HTTP_400_BAD_REQUEST)

        existing = BlogReaction.objects.filter(article=article, fingerprint=fp).first()
        if existing:
            if existing.reaction == reaction_type:
                existing.delete()
                active_reaction = None
            else:
                existing.reaction = reaction_type
                existing.save()
                active_reaction = reaction_type
        else:
            BlogReaction.objects.create(
                article=article, reaction=reaction_type, fingerprint=fp, ip_address=ip
            )
            active_reaction = reaction_type

        return Response({
            'reaction': active_reaction,
            'summary': article.reaction_summary,
        })


class BlogShareRecordView(APIView):
    def post(self, request, slug, platform):
        article = get_object_or_404(BlogArticle, slug=slug, is_published=True)
        valid_platforms = [p[0] for p in BlogShareCount.PLATFORMS]
        if platform not in valid_platforms:
            return Response({'detail': 'Invalid platform.'}, status=status.HTTP_400_BAD_REQUEST)
        sc, _ = BlogShareCount.objects.get_or_create(article=article, platform=platform)
        sc.count += 1
        sc.save()
        return Response({'platform': platform, 'count': sc.count})
