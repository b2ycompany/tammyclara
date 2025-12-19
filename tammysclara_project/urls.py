from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Importa o CRM customizado
from store.admin import crm_admin_site

urlpatterns = [
    # 1. Admin Padrão
    path('admin/', admin.site.urls),

    # 2. Dashboard CRM: https://tammysstore.com.br/crm-dashboard/
    path('crm-dashboard/', crm_admin_site.urls),

    # 3. App Store (Loja, PDV e APIs)
    path('', include('store.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)