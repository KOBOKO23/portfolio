"""
Tests for the projects app.

Covers:
- ProjectCategory and Project model behaviour
- GET /api/projects/ list
- GET /api/projects/<slug>/ detail
- technologies_list property
"""

from django.test import TestCase
from rest_framework.test import APIClient

from .models import Project, ProjectCategory

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_category(**kwargs) -> ProjectCategory:
    defaults = {'name': 'Backend Development', 'color': '#2d5a2d'}
    defaults.update(kwargs)
    return ProjectCategory.objects.create(**defaults)


def make_project(category=None, **kwargs) -> Project:
    defaults = {
        'title': 'Django REST API Framework',
        'description': 'Scalable REST API for enterprise applications.',
        'category': category,
        'technologies': ['Python', 'Django', 'PostgreSQL'],
        'is_featured': False,
    }
    defaults.update(kwargs)
    return Project.objects.create(**defaults)


# ── Model Tests ───────────────────────────────────────────────────────────────

class ProjectCategoryModelTest(TestCase):
    def test_slug_auto_generated(self):
        cat = make_category(name='Data Science')
        self.assertEqual(cat.slug, 'data-science')

    def test_str_returns_name(self):
        cat = make_category()
        self.assertEqual(str(cat), 'Backend Development')

    def test_project_count_property(self):
        cat = make_category()
        make_project(category=cat)
        make_project(category=cat, title='Second Project')
        self.assertEqual(cat.project_count, 2)


class ProjectModelTest(TestCase):
    def test_slug_auto_generated_from_title(self):
        project = make_project()
        self.assertEqual(project.slug, 'django-rest-api-framework')

    def test_str_returns_title(self):
        project = make_project()
        self.assertIn('Django REST API', str(project))

    def test_technologies_list_property(self):
        project = make_project(technologies=['Python', 'Django', 'Redis'])
        self.assertEqual(project.technologies_list, ['Python', 'Django', 'Redis'])

    def test_technologies_list_fallback_on_non_list(self):
        project = Project(technologies='not-a-list')
        self.assertEqual(project.technologies_list, [])


# ── API Tests ─────────────────────────────────────────────────────────────────

class ProjectListAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        cat = make_category()
        make_project(category=cat)
        make_project(category=cat, title='NWP System', is_featured=True)

    def test_list_returns_all_projects(self):
        resp = self.client.get('/api/projects/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        results = data.get('results', data)
        self.assertEqual(len(results), 2)

    def test_featured_projects_appear_first(self):
        resp = self.client.get('/api/projects/')
        results = resp.json()['data'].get('results', resp.json()['data'])
        self.assertTrue(results[0]['is_featured'])

    def test_response_envelope_has_success_true(self):
        resp = self.client.get('/api/projects/')
        self.assertTrue(resp.json()['success'])


class ProjectDetailAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = make_project()

    def test_retrieve_by_slug(self):
        resp = self.client.get(f'/api/projects/{self.project.slug}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['data']['title'], self.project.title)

    def test_nonexistent_slug_returns_404(self):
        resp = self.client.get('/api/projects/this-does-not-exist/')
        self.assertEqual(resp.status_code, 404)

    def test_technologies_list_in_response(self):
        resp = self.client.get(f'/api/projects/{self.project.slug}/')
        techs = resp.json()['data']['technologies_list']
        self.assertIn('Django', techs)


class ProjectCategoryAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        make_category(name='Meteorology')
        make_category(name='Full Stack')

    def test_list_categories(self):
        resp = self.client.get('/api/projects/categories/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertTrue(len(data) >= 2)
