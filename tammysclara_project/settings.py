"""
Configurações para o projeto Tammy & Clara, prontas para Fly.io (produção) e ambiente local.
"""

import os
from pathlib import Path
import dj_database_url 
from dotenv import load_dotenv 

# Carrega variáveis de ambiente do arquivo .env (apenas no ambiente local)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


# 1. CONFIGURAÇÕES DE SEGURANÇA E AMBIENTE
# Busca a chave secreta da variável de ambiente (Fly.io) ou usa um valor padrão local.
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-y%k5@3=z&d-@&n79(4i^r)229*^x$@+g+21$v_c(p1q4+c+r6g')

# DEBUG: 'False' em produção (Fly.io) e 'True' em desenvolvimento local (.env)
DEBUG = os.environ.get('DEBUG', 'False') == 'True' 

# ALLOWED_HOSTS: Aceita o domínio do Fly.io e outros hosts.
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',') 
if DEBUG:
    ALLOWED_HOSTS = ['*'] # Permite tudo em desenvolvimento


# 2. DEFINIÇÃO DE APLICATIVOS

INSTALLED_APPS = [
    # Django Padrão
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Apps de Terceiros
    'rest_framework',   
    'corsheaders',      
    'django_cleanup.apps.CleanupConfig', # Módulo Correto e Necessário

    # Suas Apps Locais
    'store',            
]

# 3. MIDDLEWARE

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Para servir Static Files em produção (Fly.io)
    'django.contrib.sessions.middleware.SessionMiddleware',
    
    'corsheaders.middleware.CorsMiddleware', 
    
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
        'DIRS': [BASE_DIR / 'templates'], 
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


# 4. CONFIGURAÇÃO DE BANCO DE DADOS (SQLITE COM PERSISTÊNCIA)

DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    # Opção 1: Configuração de Produção (Se usarmos o PostgreSQL no futuro)
    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=600, ssl_require=True)
    }
else:
    # Opção 2: Configuração para Desenvolvimento e Fly.io (Custo Zero com SQLite)
    # A pasta 'db' será o ponto de montagem do volume persistente no Fly.io
    # Você deve criar uma pasta 'db' na raiz do seu projeto localmente.
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db' / 'db.sqlite3', 
        }
    }


# 5. VALIDAÇÃO DE SENHAS (Padrão)
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


# 6. INTERNACIONALIZAÇÃO

LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = True


# 7. ARQUIVOS ESTÁTICOS (STATIC) E MÍDIA (MEDIA)

STATIC_URL = 'static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static', 
]
STATIC_ROOT = BASE_DIR / 'staticfiles' 

# 🚨 CORREÇÃO CRÍTICA: STORAGES para Django 4.2+ (Resolve InvalidStorageError) 🚨
STORAGES = {
    "default": {
        # Define o storage padrão para MÍDIA (Uploads)
        "BACKEND": "django.core.files.storage.FileSystemStorage", 
    },
    "staticfiles": {
        # Define o storage para Arquivos Estáticos (WhiteNoise)
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Media files (Imagens de produtos, etc., enviadas pelos usuários)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media' # Esta pasta será montada no volume persistente


# 8. CONFIGURAÇÕES ADICIONAIS DE SEGURANÇA E CORS

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:8000", 
    "http://localhost:8000",
    # Em produção, adicione a URL base do seu Fly.io (ex: https://tammyclara-store-b2y.fly.dev)
]

CORS_ALLOW_METHODS = [
    'DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type', 'dnt', 'origin',
    'user-agent', 'x-csrftoken', 'x-requested-with',
]

# Redirecionamento forçado para HTTPS em produção (Fly.io)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False') == 'True'