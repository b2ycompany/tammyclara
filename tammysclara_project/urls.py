from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from store.admin import crm_admin_site # Importa o seu CRM customizado

urlpatterns = [
    # 1. Painel Admin Completo: https://tammysstore.com.br/admin/
    path('admin/', admin.site.urls),

    # 2. Dashboard de Vendas (CRM): https://tammysstore.com.br/crm-dashboard/sales-pipeline/
    path('crm-dashboard/', crm_admin_site.urls),

    # 3. Loja e PDV: https://tammysstore.com.br/ e /pdv/
    path('', include('store.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)