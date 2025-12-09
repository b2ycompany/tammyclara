"""
Configurações para o projeto Tammy & Clara.
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY WARNING: keep the secret key used in production secret!
# GERE UMA CHAVE SECRETA REAL E COMPLEXA PARA PRODUÇÃO!
SECRET_KEY = 'django-insecure-y%k5@3=z&d-@&n79(4i^r)229*^x$@+g+21$v_c(p1q4+c+r6g' # Placeholder

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True # MUDAR PARA False EM PRODUÇÃO

ALLOWED_HOSTS = ['*'] # Permitir todas as conexões (para desenvolvimento)


# Application definition

INSTALLED_APPS = [
    # Django Padrão
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Apps de Terceiros Necessárias
    'rest_framework',   # Para criar as APIs que o frontend usará
    'corsheaders',      # Para permitir requisições do frontend (Cross-Origin)

    # Suas Apps Locais
    'store',            # A aplicação que contém Models, Views, etc.
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    
    'corsheaders.middleware.CorsMiddleware', # Adicionado para APIs e Frontend
    
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tammysclara_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'], # Diretório global de templates
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


# Database
# Configurado para SQLite3 para desenvolvimento local
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3', 
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization

LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# ESTE É O BLOCO CHAVE PARA RESOLVER O ERRO 404 DE ARQUIVOS ESTÁTICOS:
STATIC_URL = 'static/'

STATICFILES_DIRS = [
    BASE_DIR / 'static', # Informa ao Django para procurar a pasta 'static' na raiz do projeto
]

STATIC_ROOT = BASE_DIR / 'staticfiles'


# Media files (Imagens de produtos, etc., enviadas pelos usuários)

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# --- CORS (Cross-Origin Resource Sharing) Settings ---
CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:5500", 
    "http://localhost:8000",
    "http://localhost:3000", 
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]