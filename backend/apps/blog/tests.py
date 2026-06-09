"""
Tests for the blog app.

Covers:
- BlogCategory and BlogArticle model behaviour (slug auto-generation, properties)
- BlogComment threaded structure
- BlogLike and BlogReaction uniqueness constraints
- API endpoints: categories, article list, article detail, comments, likes, reactions, shares
"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import (
    BlogArticle,
    BlogCategory,
    BlogComment,
    BlogLike,
    BlogReaction,
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_category(**kwargs) -> BlogCategory:
    defaults = {'name': 'Meteorology', 'color': '#1a4a6e'}
    defaults.update(kwargs)
    return BlogCategory.objects.create(**defaults)


def make_article(category=None, **kwargs) -> BlogArticle:
    defaults = {
        'title': 'Understanding ECMWF Forecasts',
        'excerpt': 'A look at European Centre global models.',
        'content': '## Introduction\n\nThe ECMWF model...',
        'category': category,
        'is_published': True,
    }
    defaults.update(kwargs)
    return BlogArticle.objects.create(**defaults)


# ── Model Unit Tests ──────────────────────────────────────────────────────────

class BlogCategoryModelTest(TestCase):
    def test_slug_is_auto_generated(self):
        cat = make_category(name='Data Science Insights')
        self.assertEqual(cat.slug, 'data-science-insights')

    def test_slug_not_overwritten_if_set(self):
        cat = BlogCategory.objects.create(name='Backend', slug='my-custom-slug')
        self.assertEqual(cat.slug, 'my-custom-slug')

    def test_str_returns_name(self):
        cat = make_category(name='Meteorology')
        self.assertEqual(str(cat), 'Meteorology')

    def test_article_count_only_counts_published(self):
        cat = make_category()
        make_article(category=cat, is_published=True)
        make_article(category=cat, title='Draft', is_published=False)
        self.assertEqual(cat.article_count, 1)


class BlogArticleModelTest(TestCase):
    def setUp(self):
        self.cat = make_category()
        self.article = make_article(category=self.cat)

    def test_slug_auto_generated_from_title(self):
        self.assertEqual(self.article.slug, 'understanding-ecmwf-forecasts')

    def test_str_returns_title(self):
        self.assertIn('ECMWF', str(self.article))

    def test_get_content_html_renders_markdown(self):
        html = self.article.get_content_html()
        self.assertIn('<h2>', html)
        self.assertIn('ECMWF', html)

    def test_like_count_property(self):
        self.assertEqual(self.article.like_count, 0)
        BlogLike.objects.create(article=self.article, fingerprint='fp-1')
        self.assertEqual(self.article.like_count, 1)

    def test_comment_count_only_counts_top_level_approved(self):
        parent = BlogComment.objects.create(
            article=self.article, author_name='Alice',
            author_email='a@test.com', content='Great!', is_approved=True,
        )
        BlogComment.objects.create(
            article=self.article, parent=parent, author_name='Bob',
            author_email='b@test.com', content='Agreed!', is_approved=True,
        )
        BlogComment.objects.create(
            article=self.article, author_name='Pending',
            author_email='p@test.com', content='Hmm.', is_approved=False,
        )
        self.assertEqual(self.article.comment_count, 1)

    def test_reaction_summary_contains_all_types(self):
        summary = self.article.reaction_summary
        for key in ('love', 'fire', 'clap', 'mind_blown', 'insightful'):
            self.assertIn(key, summary)

    def test_reaction_summary_counts_correctly(self):
        BlogReaction.objects.create(article=self.article, reaction='fire', fingerprint='fp-x')
        BlogReaction.objects.create(article=self.article, reaction='fire', fingerprint='fp-y')
        summary = self.article.reaction_summary
        self.assertEqual(summary['fire'], 2)
        self.assertEqual(summary['love'], 0)


class BlogLikeUniquenessTest(TestCase):
    def test_duplicate_fingerprint_raises(self):
        article = make_article()
        BlogLike.objects.create(article=article, fingerprint='fp-same')
        with self.assertRaises(Exception):
            BlogLike.objects.create(article=article, fingerprint='fp-same')


class BlogReactionUniquenessTest(TestCase):
    def test_duplicate_fingerprint_raises(self):
        article = make_article()
        BlogReaction.objects.create(article=article, reaction='love', fingerprint='fp-1')
        with self.assertRaises(Exception):
            BlogReaction.objects.create(article=article, reaction='fire', fingerprint='fp-1')


# ── API Integration Tests ─────────────────────────────────────────────────────

class BlogAPITestBase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = make_category()
        self.article = make_article(category=self.cat)


class BlogCategoryAPITest(BlogAPITestBase):
    def test_list_categories(self):
        resp = self.client.get('/api/blog/categories/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        body = resp.json()
        self.assertTrue(body['success'])
        self.assertTrue(len(body['data']) >= 1)


class BlogArticleListAPITest(BlogAPITestBase):
    def test_list_returns_only_published(self):
        make_article(title='Hidden Draft', is_published=False)
        resp = self.client.get('/api/blog/articles/')
        self.assertEqual(resp.status_code, 200)
        slugs = [a['slug'] for a in resp.json()['data']['results']]
        self.assertNotIn('hidden-draft', slugs)

    def test_search_by_title(self):
        resp = self.client.get('/api/blog/articles/?search=ECMWF')
        self.assertEqual(resp.status_code, 200)
        results = resp.json()['data']['results']
        self.assertTrue(any('ECMWF' in r['title'] for r in results))

    def test_filter_by_category_slug(self):
        resp = self.client.get(f'/api/blog/articles/?category__slug={self.cat.slug}')
        self.assertEqual(resp.status_code, 200)


class BlogArticleDetailAPITest(BlogAPITestBase):
    def test_retrieve_by_slug(self):
        resp = self.client.get(f'/api/blog/articles/{self.article.slug}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['data']['title'], self.article.title)

    def test_view_count_increments_on_retrieval(self):
        self.client.get(f'/api/blog/articles/{self.article.slug}/')
        self.article.refresh_from_db()
        self.assertEqual(self.article.views, 1)

    def test_unpublished_returns_404(self):
        draft = make_article(title='Unpublished Article', is_published=False)
        resp = self.client.get(f'/api/blog/articles/{draft.slug}/')
        self.assertEqual(resp.status_code, 404)


class BlogCommentAPITest(BlogAPITestBase):
    def test_post_comment(self):
        payload = {
            'author_name': 'Alice',
            'author_email': 'alice@test.com',
            'content': 'Excellent breakdown of the IFS model!',
        }
        resp = self.client.post(
            f'/api/blog/articles/{self.article.slug}/comments/',
            payload, format='json',
        )
        self.assertEqual(resp.status_code, 201)

    def test_list_shows_only_approved_top_level_comments(self):
        BlogComment.objects.create(
            article=self.article, author_name='A', author_email='a@t.com',
            content='Visible.', is_approved=True,
        )
        BlogComment.objects.create(
            article=self.article, author_name='B', author_email='b@t.com',
            content='Hidden.', is_approved=False,
        )
        resp = self.client.get(f'/api/blog/articles/{self.article.slug}/comments/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        # paginated: data is {count, results, ...} or a flat list depending on config
        items = data.get('results', data) if isinstance(data, dict) else data
        contents = [c['content'] for c in items]
        self.assertIn('Visible.', contents)
        self.assertNotIn('Hidden.', contents)

    def test_comments_blocked_when_disabled(self):
        self.article.allow_comments = False
        self.article.save()
        resp = self.client.post(
            f'/api/blog/articles/{self.article.slug}/comments/',
            {'author_name': 'X', 'author_email': 'x@t.com', 'content': 'Try!'},
            format='json',
        )
        self.assertEqual(resp.status_code, 403)


class BlogLikeAPITest(BlogAPITestBase):
    def test_like_creates_and_returns_liked_true(self):
        resp = self.client.post(
            f'/api/blog/articles/{self.article.slug}/like/',
            HTTP_X_FINGERPRINT='fp-abc',
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()['data']['liked'])

    def test_second_like_toggles_off(self):
        self.client.post(
            f'/api/blog/articles/{self.article.slug}/like/',
            HTTP_X_FINGERPRINT='fp-abc',
        )
        resp = self.client.post(
            f'/api/blog/articles/{self.article.slug}/like/',
            HTTP_X_FINGERPRINT='fp-abc',
        )
        self.assertFalse(resp.json()['data']['liked'])


class BlogReactionAPITest(BlogAPITestBase):
    def _react(self, reaction_type, fp='fp-test'):
        return self.client.post(
            f'/api/blog/articles/{self.article.slug}/react/',
            {'reaction': reaction_type},
            format='json',
            HTTP_X_FINGERPRINT=fp,
        )

    def test_add_reaction(self):
        resp = self._react('fire')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['data']['reaction'], 'fire')

    def test_toggle_same_reaction_removes_it(self):
        self._react('fire')
        resp = self._react('fire')
        self.assertIsNone(resp.json()['data']['reaction'])

    def test_change_reaction_type(self):
        self._react('love')
        resp = self._react('clap')
        self.assertEqual(resp.json()['data']['reaction'], 'clap')

    def test_invalid_reaction_returns_400(self):
        resp = self._react('shrug')
        self.assertEqual(resp.status_code, 400)


class BlogShareAPITest(BlogAPITestBase):
    def test_record_share_increments_count(self):
        resp = self.client.post(
            f'/api/blog/articles/{self.article.slug}/share/twitter/'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['data']['count'], 1)

        # second share increments again
        resp2 = self.client.post(
            f'/api/blog/articles/{self.article.slug}/share/twitter/'
        )
        self.assertEqual(resp2.json()['data']['count'], 2)

    def test_invalid_platform_returns_400(self):
        resp = self.client.post(
            f'/api/blog/articles/{self.article.slug}/share/tiktok/'
        )
        self.assertEqual(resp.status_code, 400)
