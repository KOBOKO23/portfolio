"""Security regression tests: rate limits, spoofed IPs, admin lockout."""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.blog.models import BlogArticle
from utils.request import client_ip

LOCMEM = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}


class ClientIpTest(TestCase):
    def test_prefers_nginx_real_ip_over_forwarded_for(self):
        class R:
            META = {
                "HTTP_X_FORWARDED_FOR": "1.2.3.4",
                "HTTP_X_REAL_IP": "203.0.113.9",
                "REMOTE_ADDR": "127.0.0.1",
            }

        self.assertEqual(client_ip(R), "203.0.113.9")


@override_settings(CACHES=LOCMEM)
class RateLimitTest(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.article = BlogArticle.objects.create(
            title="T", slug="t", excerpt="e", content="c", is_published=True
        )

    def test_comment_limit_cannot_be_dodged_with_fake_ips(self):
        url = f"/api/blog/articles/{self.article.slug}/comments/"
        codes = [
            self.client.post(
                url,
                {"author_name": "Bot", "author_email": "b@x.com", "content": f"spam {i}"},
                format="json",
                # A fresh fake address each time; nginx appends the real one last.
                HTTP_X_FORWARDED_FOR=f"10.0.0.{i}, 198.51.100.7",
            ).status_code
            for i in range(12)
        ]
        self.assertEqual(codes[:10], [201] * 10)
        self.assertEqual(codes[10:], [429, 429])

    def test_reading_comments_is_not_limited_by_the_comment_scope(self):
        url = f"/api/blog/articles/{self.article.slug}/comments/"
        for _ in range(15):
            self.assertEqual(self.client.get(url).status_code, 200)

    def test_password_reset_is_rate_limited(self):
        url = f"/{settings.ADMIN_URL}password_reset/"
        codes = [
            self.client.post(
                url, {"email": "owner@example.com"}, REMOTE_ADDR="198.51.100.8"
            ).status_code
            for _ in range(6)
        ]
        self.assertEqual(codes[:5], [302] * 5)
        self.assertEqual(codes[5], 429)


@override_settings(CACHES=LOCMEM)
class AdminLockoutTest(TestCase):
    def setUp(self):
        cache.clear()
        get_user_model().objects.create_superuser("owner", "o@x.com", "Correct-Horse-9!")
        self.url = f"/{settings.ADMIN_URL}login/"

    def _login(self, password, ip="198.51.100.20"):
        return self.client.post(
            self.url,
            {"username": "owner", "password": password, "next": f"/{settings.ADMIN_URL}"},
            REMOTE_ADDR=ip,
            HTTP_X_REAL_IP=ip,
        )

    def test_five_wrong_passwords_lock_out_that_address(self):
        for _ in range(5):
            self._login("wrong")
        # Even the right password is refused from the locked address...
        self.assertEqual(self._login("Correct-Horse-9!").status_code, 429)
        # ...but the owner can still sign in from elsewhere.
        self.assertEqual(self._login("Correct-Horse-9!", ip="203.0.113.50").status_code, 302)
