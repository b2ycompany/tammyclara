# tammysclara_project/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings 
from django.conf.urls.static import static 
from django.views.generic import TemplateView 

# Importe a instância do seu Admin Site customizado
from store.admin import crm_admin_site 
# Não precisamos importar SaleCreate aqui, pois será carregada via include('store.urls')
# from store.views import SaleCreate 

urlpatterns = [
    # Rota para o Painel de Administração Padrão
    path('admin/', admin.site.urls), 
    
    # 🚨 NOVO: Rota para o Dashboard de Vendas (CRM) 🚨
    # Acessível em http://127.0.0.1:8000/crm-dashboard/
    path('crm-dashboard/', crm_admin_site.urls), 
    
    # Rota para a API do Checkout (POST) - LINHA REMOVIDA DAQUI PARA EVITAR DUPLICAÇÃO! 
    # path('api/checkout/', SaleCreate.as_view(), name='checkout-create'), 
    
    # 🌟 CORREÇÃO 🌟: TODAS AS ROTAS DE API ESTÃO AGORA APENAS AQUI
    path('api/', include('store.urls')),
    
    # Rotas do Frontend estático (Templates)
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('products/', TemplateView.as_view(template_name='products.html'), name='products'),
    path('cart/', TemplateView.as_view(template_name='cart.html'), name='cart'),

    # 🚨 NOVO: Rota para a Página de Sucesso (Redirecionamento do Checkout) 🚨
    path('order-success/', TemplateView.as_view(template_name='order_success.html'), name='order-success'),
]

# Configuração para servir arquivos estáticos e de mídia em ambiente de desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)