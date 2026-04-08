from __future__ import annotations

import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]

for env_path in (BASE_DIR / ".env", BASE_DIR.parent / ".env"):
    if env_path.exists():
        load_dotenv(env_path)

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-secret-key")
DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() == "true"


def env_flag(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() == "true"


def env_list(name: str) -> list[str]:
    return [item.strip() for item in os.getenv(name, "").split(",") if item.strip()]


allowed_hosts = env_list("DJANGO_ALLOWED_HOSTS")
vercel_url = os.getenv("VERCEL_URL", "").strip()
if vercel_url:
    allowed_hosts.extend([vercel_url, ".vercel.app"])

ALLOWED_HOSTS = list(dict.fromkeys(allowed_hosts))

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "django_filters",
    "apps.accounts",
    "apps.analytics",
    "apps.taxonomy",
    "apps.documents",
    "apps.moderation",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "config.wsgi.app"
ASGI_APPLICATION = "config.asgi.application"

database_url = os.getenv("DATABASE_URL")
if database_url:
    DATABASES = {
        "default": dj_database_url.parse(
            database_url,
            conn_max_age=int(os.getenv("DJANGO_DB_CONN_MAX_AGE", "60")),
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "sliit_archive"),
            "USER": os.getenv("POSTGRES_USER", "sliit"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "sliit"),
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
        }
    }

AUTH_USER_MODEL = "accounts.User"
AUTHENTICATION_BACKENDS = [
    "apps.accounts.backends.EmailOrUsernameBackend",
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Colombo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("DJANGO_CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = list(CORS_ALLOWED_ORIGINS)

GOOGLE_OAUTH_CLIENT_ID = os.getenv(
    "GOOGLE_OAUTH_CLIENT_ID",
    os.getenv("VITE_GOOGLE_CLIENT_ID", ""),
).strip()
GOOGLE_ANALYTICS_MEASUREMENT_ID = os.getenv("VITE_GA_MEASUREMENT_ID", "").strip()

SESSION_COOKIE_NAME = "sliit_sessionid"
SESSION_COOKIE_AGE = int(os.getenv("DJANGO_SESSION_COOKIE_AGE", str(60 * 60 * 24 * 14)))
SESSION_SAVE_EVERY_REQUEST = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = os.getenv("DJANGO_SESSION_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_SECURE = env_flag("DJANGO_SESSION_COOKIE_SECURE", not DEBUG)
CSRF_COOKIE_NAME = "csrftoken"
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = os.getenv("DJANGO_CSRF_COOKIE_SAMESITE", "Lax")
CSRF_COOKIE_SECURE = env_flag("DJANGO_CSRF_COOKIE_SECURE", not DEBUG)

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "SLIIT Uni Archive API",
    "DESCRIPTION": "Community-driven digital archive for SLIIT study materials.",
    "VERSION": "v1",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_LIFETIME_MINUTES", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_LIFETIME_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 10 * 60
CELERY_TASK_SOFT_TIME_LIMIT = 8 * 60

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

CLOUDFLARE_R2_ACCESS_KEY_ID = os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID", os.getenv("AWS_ACCESS_KEY_ID", ""))
CLOUDFLARE_R2_SECRET_ACCESS_KEY = os.getenv(
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY", os.getenv("AWS_SECRET_ACCESS_KEY", "")
)
CLOUDFLARE_R2_BUCKET_NAME = os.getenv("CLOUDFLARE_R2_BUCKET_NAME", os.getenv("AWS_STORAGE_BUCKET_NAME", ""))
CLOUDFLARE_R2_ENDPOINT_URL = os.getenv("CLOUDFLARE_R2_ENDPOINT_URL", os.getenv("AWS_S3_ENDPOINT_URL", ""))
CLOUDFLARE_R2_REGION = os.getenv("CLOUDFLARE_R2_REGION", os.getenv("AWS_S3_REGION_NAME", "auto"))
CLOUDFLARE_R2_QUERYSTRING_AUTH = (
    os.getenv("CLOUDFLARE_R2_QUERYSTRING_AUTH", os.getenv("AWS_QUERYSTRING_AUTH", "False")).lower() == "true"
)
CLOUDFLARE_R2_DEFAULT_ACL = os.getenv("CLOUDFLARE_R2_DEFAULT_ACL", os.getenv("AWS_DEFAULT_ACL", "private"))
CLOUDFLARE_R2_ADDRESSING_STYLE = os.getenv(
    "CLOUDFLARE_R2_ADDRESSING_STYLE", os.getenv("AWS_S3_ADDRESSING_STYLE", "virtual")
)
CLOUDFLARE_R2_SIGNATURE_VERSION = os.getenv(
    "CLOUDFLARE_R2_SIGNATURE_VERSION", os.getenv("AWS_S3_SIGNATURE_VERSION", "s3v4")
)
CLOUDFLARE_R2_FILE_OVERWRITE = (
    os.getenv("CLOUDFLARE_R2_FILE_OVERWRITE", os.getenv("AWS_S3_FILE_OVERWRITE", "False")).lower() == "true"
)
CLOUDFLARE_R2_CUSTOM_DOMAIN = os.getenv("CLOUDFLARE_R2_CUSTOM_DOMAIN", os.getenv("AWS_S3_CUSTOM_DOMAIN", ""))
CLOUDFLARE_R2_PUBLIC_BASE_URL = os.getenv("CLOUDFLARE_R2_PUBLIC_BASE_URL", "").strip().rstrip("/")

if not CLOUDFLARE_R2_PUBLIC_BASE_URL and CLOUDFLARE_R2_CUSTOM_DOMAIN:
    custom = CLOUDFLARE_R2_CUSTOM_DOMAIN.strip().rstrip("/")
    if custom.startswith("http://") or custom.startswith("https://"):
        CLOUDFLARE_R2_PUBLIC_BASE_URL = custom
    else:
        CLOUDFLARE_R2_PUBLIC_BASE_URL = f"https://{custom}"

if not CLOUDFLARE_R2_PUBLIC_BASE_URL and CLOUDFLARE_R2_BUCKET_NAME and CLOUDFLARE_R2_ENDPOINT_URL:
    endpoint_host = urlparse(CLOUDFLARE_R2_ENDPOINT_URL).netloc
    if endpoint_host.endswith(".r2.cloudflarestorage.com"):
        account_id = endpoint_host.split(".", 1)[0]
        CLOUDFLARE_R2_PUBLIC_BASE_URL = f"https://{CLOUDFLARE_R2_BUCKET_NAME}.{account_id}.r2.dev"

# django-storages still expects AWS-compatible setting names internally.
AWS_ACCESS_KEY_ID = CLOUDFLARE_R2_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = CLOUDFLARE_R2_SECRET_ACCESS_KEY
AWS_STORAGE_BUCKET_NAME = CLOUDFLARE_R2_BUCKET_NAME
AWS_S3_ENDPOINT_URL = CLOUDFLARE_R2_ENDPOINT_URL
AWS_S3_REGION_NAME = CLOUDFLARE_R2_REGION
AWS_QUERYSTRING_AUTH = CLOUDFLARE_R2_QUERYSTRING_AUTH
AWS_DEFAULT_ACL = CLOUDFLARE_R2_DEFAULT_ACL
AWS_S3_ADDRESSING_STYLE = CLOUDFLARE_R2_ADDRESSING_STYLE
AWS_S3_SIGNATURE_VERSION = CLOUDFLARE_R2_SIGNATURE_VERSION
AWS_S3_FILE_OVERWRITE = CLOUDFLARE_R2_FILE_OVERWRITE
AWS_S3_CUSTOM_DOMAIN = CLOUDFLARE_R2_CUSTOM_DOMAIN

if CLOUDFLARE_R2_BUCKET_NAME and CLOUDFLARE_R2_ENDPOINT_URL:
    STORAGES = {
        "default": {
            "BACKEND": "config.storage.R2MediaStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }
else:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }
