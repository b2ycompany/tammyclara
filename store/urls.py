from django.urls import path
from django.http import HttpResponse
from . import views

# Função simples para health check que não depende de infraestrutura complexa
def healthz(request):
    return HttpResponse("ok")

urlpatterns = [
    # Endpoint de saúde para o Fly.io
    path('healthz/', healthz, name='healthz'),
    
    # Rota Principal (E-commerce)
    path('', views.home, name='home'),
    
    # Produtos e API
    path('produtos/', views.product_list, name='products'),
    path('api/products/', views.api_product_list, name='api_products'),
    
    # Carrinho e Checkout
    path('carrinho/', views.cart_view, name='cart'),
    path('api/checkout/', views.api_checkout, name='api_checkout'),
    path('order-success/', views.order_success, name='order_success'),
    
    # CRM e PDV
    path('pdv/', views.pos_view, name='pos'),
    path('api/customer/search/<str:phone_number>/', views.api_customer_search, name='api_customer_search'),
]