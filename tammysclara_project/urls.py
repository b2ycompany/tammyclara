# tammysclara_project/urls.py (NOVA VERSÃO)

from django.contrib import admin
from django.urls import path, include
from django.conf import settings 
from django.conf.urls.static import static 
# REMOVIDO: from django.views.generic import TemplateView 

# Importe o módulo completo de views para maior robustez
import store.views 
# Importe a instância do seu Admin Site customizado
from store.admin import crm_admin_site 


urlpatterns = [
    # Rota para o Painel de Administração Padrão
    path('admin/', admin.site.urls), # O Admin funciona, provando que este bloco é OK
    
    # Rota para o Dashboard de Vendas (CRM) 
    path('crm-dashboard/', crm_admin_site.urls), 
    
    # Rotas de API
    path('api/', include('store.urls')),
    
    # 🌟 CORREÇÃO FOCADA: Usando o módulo importado
    path('', store.views.home_view, name='home'),
    path('products/', store.views.products_view, name='products'),
    path('cart/', store.views.cart_view, name='cart'),

    # Substituindo a rota de sucesso
    path('order-success/', store.views.order_success_view, name='order-success'),
]

# Configuração para servir arquivos estáticos e de mídia em ambiente de desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)