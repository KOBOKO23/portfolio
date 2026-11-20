"""
config/admin_auth.py — Rate-limited admin password reset.

Django's PasswordResetView has no limit of its own, so a script could make the
site send reset emails over and over. Each address may submit the form a few
times an hour; after that the form is shown again with an error and nothing is
sent.
"""

from django.contrib.auth import views as auth_views
from django.core.cache import cache

from utils.request import client_ip

RESET_LIMIT = 5
RESET_WINDOW_SECONDS = 60 * 60


class ThrottledPasswordResetView(auth_views.PasswordResetView):
    def post(self, request, *args, **kwargs):
        key = f"pwreset:{client_ip(request)}"
        attempts = cache.get(key, 0)
        if attempts >= RESET_LIMIT:
            form = self.get_form()
            form.is_valid()
            form.add_error(None, "Too many reset requests. Please try again in an hour.")
            return self.render_to_response(self.get_context_data(form=form), status=429)
        cache.set(key, attempts + 1, RESET_WINDOW_SECONDS)
        return super().post(request, *args, **kwargs)
