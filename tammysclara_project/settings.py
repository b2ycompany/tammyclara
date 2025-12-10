"""
Configurações para o projeto Tammy & Clara, preparadas para Fly.io e ambiente local.
"""

import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

# Carregar .env localmente
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================
# 1. SEGURANÇA E AMBIENTE
# ============================================================

SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-y%k5@3=z&d-@&n79(4i^r)229*^x$@+g+21$v_c(p1q4+c+r6g'
)

DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Permitindo host do Fly.io
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')
if DEBUG:
    ALLOWED_HOSTS = ['*']

#CORREÇÃO CRÍTICA DO ERRO 500 (OBRIGATÓRIO NO DJANGO 4+)
CSRF_TRUSTED_ORIGINS = [
    'https://tammyclara-store-b2y.fly.dev',
]

# ============================================================
# 2. APLICATIVOS
# ============================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Apps externos
    'rest_framework',
    'corsheaders',
    'django_cleanup.apps.CleanupConfig',

    # Apps locais
    'store',
]

# ============================================================
# 3. MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Estáticos em produção

    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',

    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',

    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',

    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tammysclara_project.urls'

# ============================================================
# 4. TEMPLATE ENGINE
# ============================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',

        # Os templates ficam em /templates/
        'DIRS': [os.path.join(BASE_DIR, 'templates')],

        'APP_DIRS': True,

        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'tammysclara_project.wsgi.application'

# ============================================================
# 5. BANCO DE DADOS (Fly.io usa SQLite persistido)
# ============================================================

DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    # Caso você troque futuramente para PostgreSQL
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=True
        )
    }
else:
    # SQLite com volume persistido
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'data', 'db.sqlite3'),
        }
    }

# ============================================================
# 6. SENHAS
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============================================================
# 7. INTERNACIONALIZAÇÃO
# ============================================================

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True
USE_TZ = True

# ============================================================
# 8. STATICFILES / MEDIA (PRODUÇÃO + DESENVOLVIMENTO)
# ============================================================

STATIC_URL = 'static/'

# Onde ficam seus arquivos estáticos do frontend
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# Pasta onde o Whitenoise empacota os arquivos para produção
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Armazenamento otimizado do Whitenoise
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Arquivos enviados pelo usuário (imagens de produto)
MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'data', 'media')

# ============================================================
# 9. CORS
# ============================================================

CORS_ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://tammyclara-store-b2y.fly.dev",
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://(\w+\.)?tammyclara-store-b2y\.fly\.dev$",
]

CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]

CORS_ALLOW_HEADERS = [
    "accept", "accept-encoding", "authorization", "content-type",
    "dnt", "origin", "user-agent", "x-csrftoken", "x-requested-with",
]

# ============================================================
# 10. HTTPS (Fly.io)
# ============================================================

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# HEALTH CHECK DO FLY NÃO FUNCIONA SE ISSO ESTIVER TRUE
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False') == 'True'

# ============================================================
# 11. PADRÃO
# ============================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
