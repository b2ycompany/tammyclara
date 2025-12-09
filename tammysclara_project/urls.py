from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView # Importa o TemplateView

urlpatterns = [
    # Rota para o Painel de Administração
    path('admin/', admin.site.urls), 
    
    # Rota para a API (Conexão do Frontend)
    path('api/', include('store.urls')), 
    
    # Rota para a Página Inicial (/)
    # O TemplateView carrega o arquivo 'index.html' da pasta 'templates/'
    path('', TemplateView.as_view(template_name='index.html'), name='home'), 

    # Rotas para outras páginas do Frontend estático
    path('products.html', TemplateView.as_view(template_name='products.html'), name='products'),
    path('cart.html', TemplateView.as_view(template_name='cart.html'), name='cart'),
]