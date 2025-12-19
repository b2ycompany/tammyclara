import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Caminho base do projeto
BASE_DIR = Path(__file__).resolve().parent.parent

# SEGURANÇA: Chave secreta para produção
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-prod-key-fixed-tammys')

# DEBUG deve ser False em produção
DEBUG = False

# ✅ Permite todos os domínios para evitar erros de Host
ALLOWED_HOSTS = ['*']

# ✅ Configuração de CSRF para o domínio GoDaddy e Fly.io
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
    'rest_framework',
    'store', # Seu aplicativo principal
]

# ✅ Ordem Crítica: WhiteNoise deve vir logo após o SecurityMiddleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # ✅ LIGA O LAYOUT DA HOME
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tammysclara_project.urls'

# ✅ CONFIGURAÇÃO DE TEMPLATES: Ajustada para a sua estrutura real
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'), # ✅ Onde estão index.html, pos.html, etc.
        ],
        'APP_DIRS': True, # ✅ Faz o Django procurar em store/templates/admin/ para o CRM
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

# ✅ Base de Dados no volume persistente do Fly.io
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '/app/data/db.sqlite3',
    }
}

# Internacionalização
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# ✅ CONFIGURAÇÃO DE FICHEIROS ESTÁTICOS (Layout e Imagens da Home)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Pasta onde estão styles.css e imagens como logo_tammy_clara.png
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# ✅ MOTOR DE ARMAZENAMENTO SIMPLIFICADO: Garante que as imagens apareçam sem mudar o nome
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage", 
    },
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
}

# ✅ CONFIGURAÇÃO DE MEDIA (Fotos de produtos)
MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/data/media'

# Configurações de Segurança para Fly.io (HTTPS)
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'