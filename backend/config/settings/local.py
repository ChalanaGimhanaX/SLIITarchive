# ruff: noqa: F405
import os

from .base import *  # noqa: F401,F403

DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

if len(SECRET_KEY) < 32:
    SECRET_KEY = "local-dev-secret-key-change-me-please-123456"

USE_SQLITE = os.getenv("DJANGO_USE_SQLITE", "True").lower() == "true"
USE_LOCAL_FILE_STORAGE = os.getenv("DJANGO_LOCAL_FILE_STORAGE", "False").lower() == "true"

if USE_SQLITE:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "local.sqlite3",
        }
    }

if USE_LOCAL_FILE_STORAGE:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https?://localhost(:\d+)?$",
    r"^https?://127\.0\.0\.1(:\d+)?$",
    r"^https?://0\.0\.0\.0(:\d+)?$",
]
CORS_ALLOW_CREDENTIALS = True
SESSION_COOKIE_SECURE = env_flag("DJANGO_SESSION_COOKIE_SECURE", False)
CSRF_COOKIE_SECURE = env_flag("DJANGO_CSRF_COOKIE_SECURE", False)

MEDIA_ROOT = BASE_DIR / "media-local"
STATIC_ROOT = BASE_DIR / "staticfiles"
os.makedirs(MEDIA_ROOT, exist_ok=True)
os.makedirs(STATIC_ROOT, exist_ok=True)

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
