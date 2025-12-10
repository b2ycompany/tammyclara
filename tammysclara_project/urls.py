# tammysclara_project/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings 
from django.conf.urls.static import static 
from django.views.generic import TemplateView 

# Importe a instância do seu Admin Site customizado
from store.admin import crm_admin_site 
# ⬅️ IMPORTAÇÃO CRÍTICA: As novas views de função
from store.views import home_view, products_view, cart_view


urlpatterns = [
    # Rota para o Painel de Administração Padrão
    path('admin/', admin.site.urls), 
    
    # Rota para o Dashboard de Vendas (CRM) 
    path('crm-dashboard/', crm_admin_site.urls), 
    
    # Rotas de API
    path('api/', include('store.urls')),
    
    # 🌟 CORREÇÃO FINAL: Rotas usando as views de função para máxima estabilidade
    path('', home_view, name='home'),
    path('products/', products_view, name='products'),
    path('cart/', cart_view, name='cart'),

    # Mantendo a rota de sucesso com TemplateView, mas você pode convertê-la se houver erro
    path('order-success/', TemplateView.as_view(template_name='order_success.html'), name='order-success'),
]

# Configuração para servir arquivos estáticos e de mídia em ambiente de desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)