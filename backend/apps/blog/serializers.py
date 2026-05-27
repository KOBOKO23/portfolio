from rest_framework import serializers
from .models import BlogCategory, BlogArticle, BlogComment, BlogLike, BlogReaction, BlogShareCount


class BlogCategorySerializer(serializers.ModelSerializer):
    article_count = serializers.SerializerMethodField()

    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'color', 'article_count']

    def get_article_count(self, obj):
        return obj.article_count


class BlogArticleListSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    thumbnail = serializers.SerializerMethodField()
    like_count = serializers.ReadOnlyField()
    comment_count = serializers.ReadOnlyField()

    class Meta:
        model = BlogArticle
        fields = [
            'id', 'title', 'slug', 'excerpt', 'thumbnail', 'thumbnail_alt',
            'category', 'tags', 'author', 'language', 'read_time',
            'views', 'like_count', 'comment_count', 'is_featured', 'published_date',
        ]

    def get_thumbnail(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
        return None


class BlogArticleDetailSerializer(BlogArticleListSerializer):
    content_html = serializers.SerializerMethodField()
    reaction_summary = serializers.ReadOnlyField()
    share_counts = serializers.SerializerMethodField()
    user_liked = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()

    class Meta(BlogArticleListSerializer.Meta):
        fields = BlogArticleListSerializer.Meta.fields + [
            'content', 'content_html', 'author_bio', 'allow_comments',
            'reaction_summary', 'share_counts', 'user_liked', 'user_reaction',
            'updated_at',
        ]

    def get_content_html(self, obj):
        return obj.get_content_html()

    def get_share_counts(self, obj):
        counts = {}
        for sc in obj.share_counts.all():
            counts[sc.platform] = sc.count
        return counts

    def _get_fingerprint(self):
        request = self.context.get('request')
        if request:
            return request.META.get('HTTP_X_FINGERPRINT', '') or request.META.get('REMOTE_ADDR', '')
        return ''

    def get_user_liked(self, obj):
        fp = self._get_fingerprint()
        if fp:
            return obj.likes.filter(fingerprint=fp).exists()
        return False

    def get_user_reaction(self, obj):
        fp = self._get_fingerprint()
        if fp:
            r = obj.reactions.filter(fingerprint=fp).first()
            return r.reaction if r else None
        return None


class CommentReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogComment
        fields = ['id', 'author_name', 'content', 'likes', 'created_at']


class BlogCommentSerializer(serializers.ModelSerializer):
    replies = CommentReplySerializer(many=True, read_only=True)

    class Meta:
        model = BlogComment
        fields = ['id', 'author_name', 'author_email', 'content', 'likes', 'created_at', 'replies']
        extra_kwargs = {
            'author_email': {'write_only': True},
        }

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            ip = (
                request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
                or request.META.get('REMOTE_ADDR')
            )
            validated_data['ip_address'] = ip
        return super().create(validated_data)


class BlogCommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogComment
        fields = ['id', 'author_name', 'author_email', 'content', 'parent', 'created_at']
        read_only_fields = ['id', 'created_at']
