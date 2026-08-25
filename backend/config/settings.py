import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_bool(name, default=False):
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    value = os.getenv(name, default)
    cleaned = []
    for item in value.split(","):
        host = item.strip().replace("https://", "").replace("http://", "").rstrip("/")
        if host:
            cleaned.append(host)
    return cleaned


SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-dev-key-change-me-production-secret-key-returnguard-2026")
DEBUG = env_bool("DJANGO_DEBUG", False)
ALLOWED_HOSTS = ["*"] if DEBUG else env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver,.onrender.com,frontend-working-in-progress.onrender.com,.railway.app,.vercel.app,*")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    # Project apps
    "common",
    "accounts",
    "merchants",
    "catalog",
    "orders",
    "payments",
    "invoices",
    "notifications",
    "returns",
    "fraud",
    "verification",
    "audit",
    "admin_api",
    "analytics",
    "shopper",
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
    "config.middleware.RequestIdMiddleware",
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
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Defaults to SQLite so the backend boots without local Postgres credentials.
# Set DB_ENGINE=postgresql (and the POSTGRES_* vars) to use PostgreSQL.
_db_engine = os.getenv("DB_ENGINE", "sqlite").strip().lower()

if _db_engine == "postgresql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "returnguard"),
            "USER": os.getenv("POSTGRES_USER", "returnguard"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "returnguard"),
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "common.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "common.exceptions.api_exception_handler",
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_REFRESH_MINUTES", "10080"))),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

def env_origins(name, default=""):
    value = os.getenv(name, default)
    cleaned = []
    for item in value.split(","):
        item = item.strip().rstrip("/")
        if item:
            if not item.startswith("http://") and not item.startswith("https://"):
                item = f"http://{item}"
            cleaned.append(item)
    return cleaned


cors_allowed_raw = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
if cors_allowed_raw.lower() in {"1", "true", "yes", "all", "*"}:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = []
else:
    CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL_ORIGINS", True)
    CORS_ALLOWED_ORIGINS = env_origins(
        "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175"
    )

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https?://.*\.vercel\.app$",
    r"^https?://.*\.netlify\.app$",
    r"^https?://.*\.onrender\.com$",
    r"^https?://.*\.railway\.app$",
]
CORS_ALLOW_CREDENTIALS = True


CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TASK_ALWAYS_EAGER = env_bool("CELERY_TASK_ALWAYS_EAGER", True)
CELERY_TASK_EAGER_PROPAGATES = True

PAYMENT_GATEWAY_SECRET = os.getenv("PAYMENT_GATEWAY_SECRET", "dev-gateway-secret")
DEMO_OTP = os.getenv("DEMO_OTP", "123456")
OTP_PEPPER = os.getenv("OTP_PEPPER", SECRET_KEY)
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "infiniteganesforu@gmail.com")
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "infiniteganesforu@gmail.com")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "kzgzqywjqocxjorv")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "25"))
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")

# Safe fallback: if SMTP is selected but host/user/password aren't filled in, fall back to console
if EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend" and not (EMAIL_HOST and EMAIL_HOST_USER and EMAIL_HOST_PASSWORD):
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


# Google Sign-In (Google Identity Services). Set GOOGLE_CLIENT_ID to enable.
GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "604991077373-64vuiauji09psh9n09gh3d8uqid444io.apps.googleusercontent.com",
)

# Media / object storage (local filesystem in dev; swap for S3-compatible storage later).
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
