"""
Django settings para Tammy's Store
Projetado para funcionar localmente (DEBUG=True) e em Fly.io (DEBUG via env var).
Atenção: ajuste SECRET_KEY, DATABASE_URL e outras VARS no ambiente do Fly.
"""

import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

# Carrega .env local (opcional)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# -------------------------
# Segurança / ambiente
# -------------------------
SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "django-insecure-default-temporary-key-change-this-in-prod"
)

# DEBUG via env var ('True' string habilita)
DEBUG = os.environ.get("DEBUG", "False") == "True"

# Hosts permitidos (padrão seguro + flexível)
DEFAULT_ALLOWED = [
    "127.0.0.1",
    "localhost",
    "tammyclara-store-b2y.fly.dev",
]
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", ",".join(DEFAULT_ALLOWED)).split(",")
ALLOWED_HOSTS = [h for h in (host.strip() for host in ALLOWED_HOSTS) if h]

# CSRF_TRUSTED_ORIGINS: usar lista via env ou incluir Fly domain
DEFAULT_CSRF = [
    "https://tammyclara-store-b2y.fly.dev",
]
CSRF_TRUSTED_ORIGINS = os.environ.get("CSRF_TRUSTED_ORIGINS", ",".join(DEFAULT_CSRF)).split(",")
CSRF_TRUSTED_ORIGINS = [x for x in (s.strip() for s in CSRF_TRUSTED_ORIGINS) if x]

# -------------------------
# Apps
# -------------------------
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third party
    "rest_framework",
    "corsheaders",
    "django_cleanup.apps.CleanupConfig",

    # Local
    "store",
]

# -------------------------
# Middleware
# -------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # serve static em produção
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "tammysclara_project.urls"

# -------------------------
# Templates
# -------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        # usa sua pasta templates/ na raiz do projeto
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "tammysclara_project.wsgi.application"

# -------------------------
# Banco de dados
# -------------------------
DATABASE_URL = os.environ.get("DATABASE_URL", "")

if DATABASE_URL:
    # Se houver DATABASE_URL (Postgres), usa dj_database_url
    DATABASES = {
        "default": dj_database_url.config(default=DATABASE_URL, conn_max_age=600, ssl_require=True)
    }
else:
    # SQLite no volume `data/` (já existente no seu repositório)
    os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": os.path.join(BASE_DIR, "data", "db.sqlite3"),
        }
    }

# -------------------------
# Password validators
# -------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# -------------------------
# Internacionalização
# -------------------------
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

# -------------------------
# Static & Media
# -------------------------
STATIC_URL = "/static/"
# Pasta onde você tem o static (dev)
STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")]
# Pasta para onde collectstatic vai (whitenoise serve desta pasta)
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Storage para arquivos estáticos (whitenoise)
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media (upload de imagens)
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "data", "media")
os.makedirs(MEDIA_ROOT, exist_ok=True)

# -------------------------
# Arquivos estáticos extras (favicon)
# -------------------------
# Verifique se você tem static/img/favicon.png no repo. Se não, coloque ou remova a referência.
# Exemplo de path: static/img/favicon.png

# -------------------------
# CORS
# -------------------------
CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "https://tammyclara-store-b2y.fly.dev",
]
CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://(\w+\.)?tammyclara-store-b2y\.fly\.dev$"]
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
CORS_ALLOW_HEADERS = [
    "accept", "accept-encoding", "authorization", "content-type", "dnt", "origin",
    "user-agent", "x-csrftoken", "x-requested-with",
]

# -------------------------
# Segurança HTTPS (configurável via env)
# -------------------------
# Se estiver atrás de proxy (Fly), informa o header do proxy para Django
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "False") == "True"
SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "False") == "True"
CSRF_COOKIE_SECURE = os.environ.get("CSRF_COOKIE_SECURE", "False") == "True"

# -------------------------
# Outros
# -------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# -------------------------
# Logging — importante para debug de 500 em produção
# -------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "%(levelname)s %(asctime)s %(name)s %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.environ.get("DJANGO_LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",  # Mostra tracebacks de 500 no stdout (fly logs)
            "propagate": False,
        },
    },
}

# -------------------------
# Utilitários/DEBUG helpers
# -------------------------
# Acrescenta CSRF_TRUSTED_ORIGINS na lista final
CSRF_TRUSTED_ORIGINS = CSRF_TRUSTED_ORIGINS

# Pequeno fallback útil para diagnósticos
if DEBUG:
    # mostra templates erros completos durante desenvolvimento
    INTERNAL_IPS = ["127.0.0.1"]

# -------------------------
# Recomendações para deploy / manutenção
# -------------------------
# 1) Ajuste SECRET_KEY no Fly: fly secrets set SECRET_KEY="valor"
# 2) Para habilitar HTTPS redirecionamento no Fly: fly secrets set SECURE_SSL_REDIRECT=True
# 3) Se usar Postgres, exporte DATABASE_URL em Fly.
# 4) Não se esqueça de rodar: python manage.py collectstatic --noinput
# 5) Migrations: python manage.py migrate --noinput
