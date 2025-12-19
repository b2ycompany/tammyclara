import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega variáveis de ambiente do ficheiro .env (se existir)
load_dotenv()

# Caminho base do projeto
BASE_DIR = Path(__file__).resolve().parent.parent

# SEGURANÇA: Mantenha a chave secreta em segredo na produção!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-prod-key-fixed-tammys')

# DEBUG deve ser False em produção no Fly.io
DEBUG = False

# ✅ Permite o seu domínio oficial e o domínio do Fly.io
ALLOWED_HOSTS = [
    'tammysstore.com.br',
    'www.tammysstore.com.br',
    'tammyclara-store-b2y.fly.dev',
    '127.0.0.1',
    'localhost'
]

# ✅ Configuração de CSRF para o domínio oficial (Evita erro 403 no login/checkout)
CSRF_TRUSTED_ORIGINS = [
    'https://tammysstore.com.br',
    'https://www.tammysstore.com.br',
    'https://tammyclara-store-b2y.fly.dev'
]

# Definição das Aplicações
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework', # Para as APIs do PDV
    'store',          # O seu App principal
]

# ✅ Ordem Crítica do Middleware (WhiteNoise deve ser o segundo)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # ✅ LIGA O LAYOUT/CSS NO FLY.IO
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tammysclara_project.urls'

# ✅ Configuração de Templates (Caminhos completos para CRM e Site)
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'),
            os.path.join(BASE_DIR, 'store', 'templates'), # Onde o sales_pipeline.html está
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

# ✅ Banco de Dados (Apontando para o volume persistente do Fly.io)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '/app/data/db.sqlite3',
    }
}

# Validação de Passwords
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internacionalização
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# ✅ CONFIGURAÇÃO DE FICHEIROS ESTÁTICOS (CSS, JS, Imagens do Site)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Onde o Django procura os seus ficheiros originais (logo, favicon)
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# ✅ Motor de armazenamento WhiteNoise (Compacta e faz cache para performance)
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
}

# ✅ CONFIGURAÇÃO DE MEDIA (Fotos dos produtos enviadas pelo Admin)
MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/data/media'

# Configurações de Segurança para Proxy (Fly.io usa HTTPS)
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'