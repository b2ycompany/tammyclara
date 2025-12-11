"""
Configurações Django corrigidas e otimizadas para o projeto Tammy & Clara
e para rodar perfeitamente no Fly.io.
"""
import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

# Carrega variáveis do .env no ambiente local
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ===========================================================
# 1. SEGURANÇA E AMBIENTE
# ===========================================================

SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = [
    "tammyclara-store-b2y.fly.dev",
    "localhost",
    "127.0.0.1",
]
if DEBUG:
    ALLOWED_HOSTS.append("*")
else:
    # ✅ MELHORIA: Adiciona o wildcard para aceitar tráfego interno do Fly.io (ex: health checks)
    ALLOWED_HOSTS.append(".*") 

# CSRF – extremamente importante no Fly.io
CSRF_TRUSTED_ORIGINS = [
    "https://tammyclara-store-b2y.fly.dev",
    "https://*.fly.dev",
]

# ===========================================================
# 2. APLICATIVOS INSTALADOS
# ===========================================================

INSTALLED_APPS = [
    # Django default
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Terceiros
    'rest_framework',
    'corsheaders',
    'django_cleanup.apps.CleanupConfig',

    # Aplicações locais
    'store',
]

# ===========================================================
# 3. MIDDLEWARE
# ===========================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # STATIC em produção

    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',

    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tammysclara_project.urls'

# ===========================================================
# 4. TEMPLATES — CAMINHO DE BUSCA
# ===========================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',

        # Corrigido o caminho estrutural para encontrar templates em store/templates/
        'DIRS': [
            BASE_DIR / 'templates',           
            BASE_DIR / 'store' / 'templates'  # Caminho correto para a estrutura do seu projeto
        ],

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

# ===========================================================
# 5. BANCO DE DADOS (Fly: SQLite persistente)
# ===========================================================

DATABASE_URL = os.environ.get('DATABASE_URL')
# Variável para forçar o caminho DB se não for URL (SQLite)
SQLITE_DB_PATH = os.environ.get('SQLITE_DB_PATH')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=600, ssl_require=True)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            # ✅ CORREÇÃO FINAL: Usa a variável de ambiente se o path DB estiver definido (para produção)
            # Caso contrário, usa o caminho original.
            'NAME': SQLITE_DB_PATH if SQLITE_DB_PATH else (BASE_DIR / 'data' / 'db.sqlite3'),
        }
    }
# ===========================================================
# 6. VALIDAÇÃO DE SENHA
# ===========================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ===========================================================
# 7. INTERNACIONALIZAÇÃO
# ===========================================================

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# ===========================================================
# 8. ARQUIVOS ESTÁTICOS E MÍDIA (Fly.io)
# ===========================================================

STATIC_URL = '/static/'

# STATICFILES_DIRS: Condicional (necessário para collectstatic local)
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

STATIC_ROOT = BASE_DIR / 'staticfiles' # Destino final do collectstatic para Whitenoise

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'data' / 'media' # Volume persistente para uploads

# ===========================================================
# 9. CORS (seguro e funcional)
# ===========================================================

CORS_ALLOWED_ORIGINS = [
    "https://tammyclara-store-b2y.fly.dev",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://(\w+\.)?tammyclara-store-b2y\.fly\.dev$",
]

# ===========================================================
# 10. HTTPS NO FLY.IO
# ===========================================================

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ✅ CORREÇÃO: Desativa o redirecionamento SSL no Django para garantir que o health check HTTP interno passe
SECURE_SSL_REDIRECT = False 

# ===========================================================
# 11. PADRÕES DJANGO
# ===========================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'