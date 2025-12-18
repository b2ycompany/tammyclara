from django.contrib import admin
from django.urls import path, include
from django.conf import settings 
from django.conf.urls.static import static 
from store.admin import crm_admin_site 

urlpatterns = [
    # 1. Admin Padrão
    path('admin/', admin.site.urls), 
    
    # 2. Pipeline de Vendas (CRM)
    path('crm-dashboard/', crm_admin_site.urls), 
    
    # 3. Todo o restante (Site, PDV, APIs e Healthz) vem de store/urls.py
    path('', include('store.urls')),
]

# Servir mídia em ambiente de desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)