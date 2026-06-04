import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-dev-key-change-in-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ─── Security ─────────────────────────────────────────────────────────────────
if not DEBUG:
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
PERMISSIONS_POLICY = {
    'camera': [],
    'microphone': [],
    'geolocation': [],
}

# Production: ensure SECRET_KEY is real
if not DEBUG and SECRET_KEY.startswith('django-insecure'):
    raise ValueError("SECRET_KEY must be set to a real secret in production (not the dev default)")

INSTALLED_APPS = [
    # Jazzmin must come BEFORE django.contrib.admin
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'corsheaders',
    'django_filters',
    # Local apps
    'apps.blog',
    'apps.projects',
    'apps.fashion',
    'apps.music',
    'apps.books',
    'apps.great_men_moves',
    'apps.newsletter',
    'apps.feedback',
    'apps.contact',
    'apps.core',
    'apps.payments',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.i18n',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ─── Database ────────────────────────────────────────────────────────────────
_db_engine = os.getenv('DB_ENGINE', 'sqlite')
if _db_engine == 'postgresql':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'portfolio'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ─── Auth ─────────────────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── i18n ─────────────────────────────────────────────────────────────────────
LANGUAGE_CODE = 'en'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_L10N = True
USE_TZ = True

LANGUAGES = [
    ('en', 'English'),
    ('sw', 'Swahili'),
    ('fr', 'French'),
    ('pt', 'Portuguese'),
    ('ar', 'Arabic'),
    ('zh', 'Chinese'),
]

LOCALE_PATHS = [BASE_DIR / 'locale']

# ─── Static & Media ───────────────────────────────────────────────────────────
USE_S3 = os.getenv('USE_S3', 'False') == 'True'

if USE_S3:
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME', '')
    AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
    AWS_S3_CUSTOM_DOMAIN = os.getenv(
        'AWS_S3_CUSTOM_DOMAIN',
        f"{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com",
    )
    AWS_DEFAULT_ACL = 'public-read'
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    AWS_QUERYSTRING_AUTH = False
    AWS_S3_FILE_OVERWRITE = False  # keep original filenames, never silently overwrite

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
            'OPTIONS': {
                'location': 'media',           # all uploads go to bucket/media/...
                'file_overwrite': False,
                'default_acl': 'public-read',
            },
        },
        'staticfiles': {
            'BACKEND': 'storages.backends.s3boto3.S3StaticStorage',
            'OPTIONS': {'location': 'static'},
        },
    }
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
else:
    STATIC_URL = '/static/'
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
    MEDIA_URL = '/media/'

STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── REST Framework ───────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'utils.pagination.StandardPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': ['utils.renderers.StandardRenderer'],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/hour',
        'user': '1000/hour',
        'contact': '5/hour',       # tighter: prevent spam
        'newsletter': '5/hour',    # tighter: prevent abuse
        'feedback': '10/hour',
    },
}

# ─── CORS ─────────────────────────────────────────────────────────────────────
_cors = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(',') if o.strip()]
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True

from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + ['x-fingerprint']

# ─── Email ────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'Koboko Newsletter <noreply@koboko.dev>')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', '')

# ─── Stripe ───────────────────────────────────────────────────────────────────
STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')

# ─── Daraja M-Pesa ────────────────────────────────────────────────────────────
DARAJA_ENV = os.getenv('DARAJA_ENV', 'sandbox')
DARAJA_CONSUMER_KEY = os.getenv('DARAJA_CONSUMER_KEY', '')
DARAJA_CONSUMER_SECRET = os.getenv('DARAJA_CONSUMER_SECRET', '')
DARAJA_SHORTCODE = os.getenv('DARAJA_SHORTCODE', '174379')
DARAJA_PASSKEY = os.getenv('DARAJA_PASSKEY', '')
DARAJA_CALLBACK_URL = os.getenv('DARAJA_CALLBACK_URL', '')

# ─── Site ─────────────────────────────────────────────────────────────────────
SITE_URL = os.getenv('SITE_URL', 'https://koboko.dev')

# ─── Weather API ──────────────────────────────────────────────────────────────
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
DEFAULT_WEATHER_CITY = os.getenv('DEFAULT_WEATHER_CITY', 'Nairobi,KE')
DEFAULT_WEATHER_LAT = float(os.getenv('DEFAULT_WEATHER_LAT', '-1.2921'))
DEFAULT_WEATHER_LON = float(os.getenv('DEFAULT_WEATHER_LON', '36.8219'))

# ─── Jazzmin Admin Theme ──────────────────────────────────────────────────────
JAZZMIN_SETTINGS = {
    "site_title": "Portfolio CMS",
    "site_header": "Koboko Portfolio",
    "site_brand": "◈ CMS",
    "site_logo": None,
    "site_logo_classes": None,
    "site_icon": None,
    "welcome_sign": "Welcome to your Portfolio Command Centre",
    "copyright": "Koboko · Meteorologist · Developer · Creator",
    "search_model": ["blog.BlogArticle", "contact.ContactMessage", "newsletter.NewsletterSubscriber"],
    "user_avatar": None,
    "topmenu_links": [
        {"name": "🌐 View Site", "url": os.getenv('SITE_URL', 'http://localhost:5173'), "new_window": True},
        {"name": "📝 New Article", "url": "/admin/blog/blogarticle/add/", "new_window": False},
        {"model": "auth.User"},
    ],
    "usermenu_links": [],
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],
    "order_with_respect_to": [
        "blog",
        "projects",
        "core",
        "great_men_moves",
        "music",
        "books",
        "fashion",
        "newsletter",
        "contact",
        "feedback",
        "auth",
    ],
    "icons": {
        "auth": "fas fa-shield-alt",
        "auth.user": "fas fa-user-circle",
        "auth.Group": "fas fa-users",
        "blog": "fas fa-pen-nib",
        "blog.BlogCategory": "fas fa-folder-open",
        "blog.BlogArticle": "fas fa-file-alt",
        "blog.BlogComment": "fas fa-comments",
        "blog.BlogLike": "fas fa-heart",
        "blog.BlogReaction": "fas fa-smile",
        "projects": "fas fa-layer-group",
        "projects.Project": "fas fa-rocket",
        "projects.ProjectCategory": "fas fa-tags",
        "core": "fas fa-id-badge",
        "core.Profile": "fas fa-user-tie",
        "core.Skill": "fas fa-code",
        "great_men_moves": "fas fa-fist-raised",
        "great_men_moves.GreatMenProgram": "fas fa-calendar-alt",
        "great_men_moves.ImpactGoal": "fas fa-bullseye",
        "great_men_moves.VolunteerApplication": "fas fa-hands-helping",
        "music": "fas fa-music",
        "music.MusicTrack": "fas fa-compact-disc",
        "books": "fas fa-book",
        "books.Book": "fas fa-book-open",
        "books.BookTestimonial": "fas fa-quote-right",
        "fashion": "fas fa-tshirt",
        "fashion.FashionCategory": "fas fa-tag",
        "fashion.FashionImage": "fas fa-images",
        "newsletter": "fas fa-envelope-open-text",
        "newsletter.NewsletterSubscriber": "fas fa-user-plus",
        "newsletter.NewsletterIssue": "fas fa-newspaper",
        "contact": "fas fa-inbox",
        "contact.ContactMessage": "fas fa-envelope",
        "feedback": "fas fa-star-half-alt",
        "feedback.Feedback": "fas fa-comment-dots",
        "payments": "fas fa-credit-card",
        "payments.PreOrder": "fas fa-shopping-cart",
    },
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    "related_modal_active": True,
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": True,
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs",
    },
    "language_chooser": False,
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": False,
    "accent": "accent-warning",
    "navbar": "navbar-dark",
    "no_navbar_border": True,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-warning",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": True,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "darkly",
    "dark_mode_theme": "darkly",
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-outline-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
    "actions_sticky_top": True,
}
