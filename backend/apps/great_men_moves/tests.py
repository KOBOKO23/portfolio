from datetime import date
from unittest.mock import patch

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import GreatMenProgram, ImpactGoal, VolunteerApplication

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_program(**kwargs) -> GreatMenProgram:
    defaults = {
        'title': 'Leadership Bootcamp Nairobi',
        'date': date(2026, 8, 15),
        'location': 'Nairobi, Kenya',
        'description': 'A three-day intensive leadership programme for young men.',
        'spots': 50,
        'is_active': True,
        'order': 0,
    }
    defaults.update(kwargs)
    return GreatMenProgram.objects.create(**defaults)


def make_goal(**kwargs) -> ImpactGoal:
    defaults = {
        'number': '500+',
        'label': 'Men Mentored',
        'progress': 85,
        'icon': 'users',
        'order': 0,
    }
    defaults.update(kwargs)
    return ImpactGoal.objects.create(**defaults)


VOLUNTEER_PAYLOAD = {
    'full_name': 'John Kamau',
    'email': 'jkamau@example.com',
    'phone': '+254700000000',
    'profession': 'Software Engineer',
    'motivation': 'I want to give back and mentor young men in tech.',
}


# ── Model Tests ───────────────────────────────────────────────────────────────

class GreatMenProgramModelTest(TestCase):
    def test_str(self):
        p = make_program()
        self.assertIn('Leadership Bootcamp Nairobi', str(p))

    def test_ordering_by_date(self):
        make_program(title='Later', date=date(2026, 9, 1))
        make_program(title='Sooner', date=date(2026, 7, 1))
        first = GreatMenProgram.objects.first()
        self.assertEqual(first.title, 'Sooner')


class ImpactGoalModelTest(TestCase):
    def test_str(self):
        g = make_goal()
        self.assertEqual(str(g), 'Men Mentored')

    def test_ordering_by_order_field(self):
        make_goal(label='B', order=2)
        make_goal(label='A', order=1)
        first = ImpactGoal.objects.first()
        self.assertEqual(first.label, 'A')


class VolunteerApplicationModelTest(TestCase):
    def test_str(self):
        app = VolunteerApplication.objects.create(**VOLUNTEER_PAYLOAD)
        self.assertIn('John Kamau', str(app))
        self.assertIn('jkamau@example.com', str(app))


# ── API Tests ─────────────────────────────────────────────────────────────────

class ProgramAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_empty_list(self):
        res = self.client.get('/api/great-men-moves/programs/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_only_active_programs_returned(self):
        make_program(title='Active', is_active=True)
        make_program(title='Inactive', is_active=False)
        res = self.client.get('/api/great-men-moves/programs/')
        titles = [p['title'] for p in res.data]
        self.assertIn('Active', titles)
        self.assertNotIn('Inactive', titles)

    def test_no_pagination(self):
        make_program()
        res = self.client.get('/api/great-men-moves/programs/')
        self.assertIsInstance(res.data, list)


class ImpactGoalAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_goals_listed(self):
        make_goal(label='Men Mentored')
        make_goal(label='Communities Reached', order=1)
        res = self.client.get('/api/great-men-moves/impact-goals/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_response_fields(self):
        make_goal()
        res = self.client.get('/api/great-men-moves/impact-goals/')
        goal = res.data[0]
        for field in ['id', 'number', 'label', 'progress', 'icon']:
            self.assertIn(field, goal)


class VolunteerAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('apps.great_men_moves.views.send_mail')
    def test_valid_submission_creates_record(self, mock_mail):
        res = self.client.post(
            '/api/great-men-moves/volunteer/',
            VOLUNTEER_PAYLOAD,
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(VolunteerApplication.objects.count(), 1)
        app = VolunteerApplication.objects.first()
        self.assertEqual(app.full_name, 'John Kamau')
        self.assertEqual(app.email, 'jkamau@example.com')

    @patch('apps.great_men_moves.views.ADMIN_EMAIL', 'admin@koboko.dev')
    @patch('apps.great_men_moves.views.send_mail')
    def test_valid_submission_triggers_email(self, mock_mail):
        self.client.post(
            '/api/great-men-moves/volunteer/',
            VOLUNTEER_PAYLOAD,
            format='json',
        )
        mock_mail.assert_called_once()
        subject = mock_mail.call_args[1]['subject'] if mock_mail.call_args[1] else mock_mail.call_args[0][0]
        self.assertIn('John Kamau', subject)

    def test_missing_required_fields_returns_400(self):
        res = self.client.post(
            '/api/great-men-moves/volunteer/',
            {'full_name': 'John'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_email_returns_400(self):
        payload = {**VOLUNTEER_PAYLOAD, 'email': 'not-an-email'}
        res = self.client.post(
            '/api/great-men-moves/volunteer/',
            payload,
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('apps.great_men_moves.views.ADMIN_EMAIL', '')
    @patch('apps.great_men_moves.views.send_mail')
    def test_no_email_sent_without_admin_email(self, mock_mail):
        self.client.post(
            '/api/great-men-moves/volunteer/',
            VOLUNTEER_PAYLOAD,
            format='json',
        )
        mock_mail.assert_not_called()
