"""
conftest.py
───────────
Pytest / Django test configuration.

Shared fixtures live here. Django's native TestCase (used in apps/*/tests.py)
does not use these fixtures — they are available when running tests via pytest-django
or when individual test files import them explicitly.

To run tests:
    python manage.py test               # run all Django tests
    python manage.py test apps.blog     # run a single app
    python manage.py test --verbosity=2 # verbose output

Test database: SQLite in-memory (auto-configured by Django's test runner).
"""
