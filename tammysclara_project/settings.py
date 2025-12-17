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
# ✅ DEBUG em False para produção (essencial para segurança)
DEBUG = os.environ.get('DEBUG', 'False') == 'True' 

# ✅ DOMÍNIOS FIXADOS PARA EVITAR ERRO 503/400
ALLOWED_HOSTS = [
    'tammysstore.com.br',
    'www.tammysstore.com.br',
    'tammyclara-store-b2y.fly.dev',
    'localhost',
    '127.0.0.1'
]

# ✅ ORIGENS CONFIÁVEIS PARA O PDV E ADMIN
CSRF_TRUSTED_ORIGINS = [
    'https://tammysstore.com.br',
    'https://www.tammysstore.com.br',
    'https://tammyclara-store-b2y.fly.dev'
]

# ===========================================================
# 2. APLICATIVOS INSTALADOS
# ===========================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'django_cleanup.apps.CleanupConfig',
    'store',
]

# ===========================================================
# 3. MIDDLEWARE
# ===========================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
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
# 4. TEMPLATES
# ===========================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',           
            BASE_DIR / 'store' / 'templates'
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
# 5. BANCO DE DADOS (CORREÇÃO: BANCO GRAVÁVEL)
# ===========================================================

# ✅ Forçamos o banco a ficar no volume montado para evitar o erro 'readonly database'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '/app/data/db.sqlite3',
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
# 8. ARQUIVOS ESTÁTICOS E MÍDIA
# ===========================================================

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/data/media'

# ===========================================================
# 9. CORS E HTTPS
# ===========================================================

CORS_ALLOWED_ORIGINS = [
    "https://tammysstore.com.br",
    "https://www.tammysstore.com.br",
    "https://tammyclara-store-b2y.fly.dev",
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = False 
APPEND_SLASH = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'