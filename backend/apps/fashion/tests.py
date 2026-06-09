from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from .models import FashionCategory, FashionImage


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_category(**kwargs) -> FashionCategory:
    defaults = {'name': 'Street Style'}
    defaults.update(kwargs)
    return FashionCategory.objects.create(**defaults)


def make_image(category=None, **kwargs) -> FashionImage:
    defaults = {
        'title': 'Nairobi Meets Tokyo',
        'description': 'Urban fashion fusion',
        'location': 'Nairobi CBD',
        'category': category,
        'order': 0,
    }
    defaults.update(kwargs)
    img = FashionImage(**defaults)
    img.image = 'fashion/test.jpg'
    img.save()
    return img


# ── Model Tests ───────────────────────────────────────────────────────────────

class FashionCategoryModelTest(TestCase):
    def test_slug_auto_generated(self):
        cat = make_category(name='Street Style')
        self.assertEqual(cat.slug, 'street-style')

    def test_slug_not_overwritten(self):
        cat = FashionCategory.objects.create(name='Casual', slug='custom-slug')
        self.assertEqual(cat.slug, 'custom-slug')

    def test_str(self):
        cat = make_category(name='Formal')
        self.assertEqual(str(cat), 'Formal')

    def test_image_count(self):
        cat = make_category()
        make_image(category=cat)
        make_image(category=cat, title='Second Look')
        self.assertEqual(cat.image_count, 2)

    def test_image_count_zero_when_no_images(self):
        cat = make_category()
        self.assertEqual(cat.image_count, 0)


class FashionImageModelTest(TestCase):
    def test_str(self):
        cat = make_category()
        img = make_image(category=cat, title='Vintage Vibes')
        self.assertEqual(str(img), 'Vintage Vibes')

    def test_ordering_by_order_then_date(self):
        cat = make_category()
        make_image(category=cat, title='B', order=2)
        make_image(category=cat, title='A', order=1)
        first = FashionImage.objects.first()
        self.assertEqual(first.title, 'A')


# ── API Tests ─────────────────────────────────────────────────────────────────

class FashionCategoryAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_empty_list(self):
        res = self.client.get('/api/fashion/categories/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_categories_listed(self):
        make_category(name='Street Style')
        make_category(name='Formal')
        res = self.client.get('/api/fashion/categories/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_no_pagination(self):
        make_category()
        res = self.client.get('/api/fashion/categories/')
        self.assertIsInstance(res.data, list)


class FashionImageAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = make_category(name='Street Style')

    def test_empty_list(self):
        res = self.client.get('/api/fashion/images/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_images_listed(self):
        make_image(category=self.cat, title='Look 1')
        make_image(category=self.cat, title='Look 2')
        res = self.client.get('/api/fashion/images/')
        self.assertGreaterEqual(len(res.data['results']), 2)

    def test_filter_by_category_slug(self):
        other_cat = make_category(name='Formal')
        make_image(category=self.cat, title='Street Look')
        make_image(category=other_cat, title='Suit Up')
        res = self.client.get('/api/fashion/images/?category__slug=street-style')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [i['title'] for i in res.data['results']]
        self.assertIn('Street Look', titles)
        self.assertNotIn('Suit Up', titles)

    def test_search_by_title(self):
        make_image(category=self.cat, title='Tokyo Vibes')
        make_image(category=self.cat, title='Nairobi Nights')
        res = self.client.get('/api/fashion/images/?search=Tokyo')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [i['title'] for i in res.data['results']]
        self.assertIn('Tokyo Vibes', titles)
        self.assertNotIn('Nairobi Nights', titles)
