# tammysclara_project/urls.py (CÓDIGO COMPLETO)

from django.contrib import admin
from django.urls import path, include
from django.conf import settings 
from django.conf.urls.static import static 

import store.views 
from store.admin import crm_admin_site 


urlpatterns = [
    # Rotas de Administração
    path('admin/', admin.site.urls), 
    path('crm-dashboard/', crm_admin_site.urls, name='crm-dashboard'), 
    
    # Rotas de API
    path('api/', include('store.urls')),
    
    # Rotas de Navegação Front-end
    path('', store.views.home_view, name='home'),
    path('products/', store.views.products_view, name='products'),
    path('cart/', store.views.cart_view, name='cart'),
    path('order-success/', store.views.order_success_view, name='order-success'),
    
    # ✅ NOVO: Rota para o Ponto de Venda (PDV)
    path('pdv/', store.views.pos_view, name='pos-view'), 

]

# Configuração para servir arquivos estáticos e de mídia em ambiente de desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)