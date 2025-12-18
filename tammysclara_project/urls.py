from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
# Importa o seu CRM customizado se ele estiver definido em store/admin.py
try:
    from store.admin import crm_admin_site
except ImportError:
    crm_admin_site = None

urlpatterns = [
    # 1. Painel Admin Completo: https://tammysstore.com.br/admin/
    path('admin/', admin.site.urls),

    # 2. Dashboard de Vendas (CRM): https://tammysstore.com.br/crm-dashboard/
    # Usamos path simples para evitar o erro de barra dupla //
]

if crm_admin_site:
    urlpatterns.append(path('crm-dashboard/', crm_admin_site.urls))

# 3. Loja e PDV: Conecta todas as rotas da pasta 'store'
urlpatterns.append(path('', include('store.urls')))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)