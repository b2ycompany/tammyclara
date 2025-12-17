# tammysclara_project/urls.py (CÓDIGO COMPLETO)

from django.contrib import admin
from django.urls import path, include
from django.conf import settings 
from django.conf.urls.static import static 

import store.views 
from store.admin import crm_admin_site 

urlpatterns = [
    # 1. Painel Admin (Completo)
    path('admin/', admin.site.urls), 
    
    # 2. Dashboard de Vendas (CRM / Pipeline)
    path('crm-dashboard/', crm_admin_site.urls), 
    
    # 3. Rotas da API e PDV (Inclui o arquivo store/urls.py)
    path('', include('store.urls')),
    
    # 4. Rotas de Navegação Front-end (Site Principal)
    path('', store.views.home_view, name='home'),
    path('products/', store.views.products_view, name='products'),
    path('cart/', store.views.cart_view, name='cart'),
    path('order-success/', store.views.order_success_view, name='order-success'),
]

# Servir arquivos de mídia em desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)