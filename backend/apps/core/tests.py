from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import CareerEvent, Profile, Skill

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_profile(**kwargs) -> Profile:
    defaults = {
        'full_name': 'Koboko Philip',
        'tagline': 'Meteorologist · Developer',
        'bio': 'Working at Kenya Met, building software.',
        'email': 'kobokophilip@gmail.com',
        'location': 'Nairobi, Kenya',
    }
    defaults.update(kwargs)
    return Profile.objects.create(**defaults)


def make_skill(**kwargs) -> Skill:
    defaults = {'name': 'Python', 'category': 'software', 'proficiency': 90}
    defaults.update(kwargs)
    return Skill.objects.create(**defaults)


def make_career_event(**kwargs) -> CareerEvent:
    defaults = {
        'year': '2024 – Present',
        'title': 'NWP Scientist',
        'organization': 'Kenya Meteorological Department',
        'description': 'Numerical weather prediction and forecasting.',
        'is_current': True,
        'order': 0,
    }
    defaults.update(kwargs)
    return CareerEvent.objects.create(**defaults)


# ── Model Tests ───────────────────────────────────────────────────────────────

class ProfileModelTest(TestCase):
    def test_str(self):
        p = make_profile()
        self.assertEqual(str(p), 'Koboko Philip')

    def test_singleton_enforced(self):
        make_profile(full_name='First')
        make_profile(full_name='Second')
        self.assertEqual(Profile.objects.count(), 1)
        self.assertEqual(Profile.objects.first().full_name, 'Second')


class SkillModelTest(TestCase):
    def test_str(self):
        s = make_skill(name='Django', category='backend')
        self.assertIn('Django', str(s))
        self.assertIn('Backend', str(s))

    def test_default_proficiency(self):
        s = Skill.objects.create(name='Docker', category='devops')
        self.assertEqual(s.proficiency, 80)

    def test_ordering_by_category_then_order(self):
        Skill.objects.create(name='B', category='software', order=2)
        Skill.objects.create(name='A', category='meteorology', order=1)
        first = Skill.objects.first()
        self.assertEqual(first.category, 'meteorology')


class CareerEventModelTest(TestCase):
    def test_str(self):
        e = make_career_event()
        self.assertIn('NWP Scientist', str(e))
        self.assertIn('Kenya Meteorological Department', str(e))

    def test_ordering_by_order_field(self):
        make_career_event(title='Later', order=2)
        make_career_event(title='First', order=1)
        self.assertEqual(CareerEvent.objects.first().title, 'First')


# ── API Tests ─────────────────────────────────────────────────────────────────

class HealthEndpointTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_returns_200(self):
        res = self.client.get('/api/health/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'ok')
        self.assertTrue(res.data['db'])


class ProfileAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_no_profile_returns_404(self):
        res = self.client.get('/api/profile/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_profile_returned_when_exists(self):
        make_profile()
        res = self.client.get('/api/profile/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['full_name'], 'Koboko Philip')

    def test_profile_includes_skills(self):
        make_profile()
        make_skill(name='Python')
        make_skill(name='Django')
        res = self.client.get('/api/profile/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        skill_names = [s['name'] for s in res.data['skills']]
        self.assertIn('Python', skill_names)
        self.assertIn('Django', skill_names)


class SkillAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_empty_list(self):
        res = self.client.get('/api/skills/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_skills_listed(self):
        make_skill(name='Python')
        make_skill(name='Fortran', category='meteorology')
        res = self.client.get('/api/skills/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_no_pagination_wrapper(self):
        make_skill()
        res = self.client.get('/api/skills/')
        self.assertIsInstance(res.data, list)


class CareerEventAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_empty_list(self):
        res = self.client.get('/api/career/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_events_listed_in_order(self):
        make_career_event(title='Second', order=2)
        make_career_event(title='First', order=1)
        res = self.client.get('/api/career/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data[0]['title'], 'First')

    def test_fields_present(self):
        make_career_event()
        res = self.client.get('/api/career/')
        event = res.data[0]
        for field in ['id', 'year', 'title', 'organization', 'description', 'is_current']:
            self.assertIn(field, event)
