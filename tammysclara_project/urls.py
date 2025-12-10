# tammysclara_project/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings 
from django.conf.urls.static import static 
from django.views.generic import TemplateView 

# Importe a instância do seu Admin Site customizado
from store.admin import crm_admin_site 
# ⬅️ IMPORTAÇÃO CRÍTICA: A nova view de função!
from store.views import ProductList, SaleCreate, home_view 


urlpatterns = [
    # Rota para o Painel de Administração Padrão
    path('admin/', admin.site.urls), 
    
    # Rota para o Dashboard de Vendas (CRM) 
    path('crm-dashboard/', crm_admin_site.urls), 
    
    # Rotas de API
    path('api/', include('store.urls')),
    
    # 🌟 CORREÇÃO CRÍTICA 500: Usando a função home_view para garantir o contexto.
    path('', home_view, name='home'),
    
    # As demais rotas de TemplateView
    path('products/', TemplateView.as_view(template_name='products.html'), name='products'),
    path('cart/', TemplateView.as_view(template_name='cart.html'), name='cart'),

    # Rota para a Página de Sucesso (Redirecionamento do Checkout) 
    path('order-success/', TemplateView.as_view(template_name='order_success.html'), name='order-success'),
]

# Configuração para servir arquivos estáticos e de mídia em ambiente de desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)