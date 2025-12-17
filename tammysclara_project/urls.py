from django.contrib import admin
from django.urls import path, include
from django.conf import settings 
from django.conf.urls.static import static 

import store.views 
from store.admin import crm_admin_site 

urlpatterns = [
    # Rotas de Administração
    path('admin/', admin.site.urls), 
    
    # ✅ Correção CRM: Garante que a rota sales-pipeline seja encontrada
    path('crm-dashboard/', crm_admin_site.urls), 
    
    # Rotas de API
    path('api/', include('store.urls')),
    
    # Rotas de Navegação Front-end
    path('', store.views.home_view, name='home'),
    path('products/', store.views.products_view, name='products'),
    path('cart/', store.views.cart_view, name='cart'),
    path('order-success/', store.views.order_success_view, name='order-success'),
    
    # ✅ Rota PDV: Garante o acesso ao Frente de Caixa
    path('pdv/', store.views.pos_view, name='pos-view'), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)