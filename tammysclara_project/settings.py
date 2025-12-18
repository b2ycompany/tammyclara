# ✅ LIBERAÇÃO DE ACESSO TOTAL
ALLOWED_HOSTS = ['*'] # Liberar tudo temporariamente para garantir o acesso

CSRF_TRUSTED_ORIGINS = [
    'https://tammysstore.com.br',
    'https://www.tammysstore.com.br',
    'https://tammyclara-store-b2y.fly.dev'
]

# Configurações de Proxy do Fly.io
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True