import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-prod-key-fixed-tammys')
DEBUG = False

ALLOWED_HOSTS = ['*']

CSRF_TRUSTED_ORIGINS = [
    'https://tammysstore.com.br',
    'https://www.tammysstore.com.br',
    'https://tammyclara-store-b2y.fly.dev'
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'store',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # ✅ ATIVA O VISUAL
    'django.contrib.sessions.middleware.SessionMiddleware',
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
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True, # ✅ Procura templates dentro de store/templates/
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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '/app/data/db.sqlite3',
    }
}

# ✅ CONFIGURAÇÃO DE ESTÁTICOS (Ajustada para os logs anteriores)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')] # ✅ Onde estão suas imagens no PC

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage", # Mantém nomes originais
    },
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
}

# ✅ CONFIGURAÇÃO DE MEDIA (Para fotos de produtos do Admin)
MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/data/media'

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'