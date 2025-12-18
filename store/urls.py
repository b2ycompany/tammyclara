from django.urls import path
from django.http import HttpResponse
from . import views

# Função de saúde ultra-rápida
def healthz(request):
    return HttpResponse("ok")

urlpatterns = [
    # Endpoint de saúde para o Fly.io
    path('healthz/', healthz, name='healthz'),
    
    # Rota Principal (E-commerce)
    path('', views.home_view, name='home'),
    
    # Produtos e APIs
    path('produtos/', views.products_view, name='products'),
    path('api/products/', views.ProductList.as_view(), name='api_products'),
    
    # Carrinho e Checkout
    path('carrinho/', views.cart_view, name='cart'),
    path('api/checkout/', views.SaleCreate.as_view(), name='api_checkout'),
    path('order-success/', views.order_success_view, name='order_success'),
    
    # CRM e PDV
    path('pdv/', views.pos_view, name='pos'),
    path('api/customer/search/<str:phone_number>/', views.CustomerSearchByPhone.as_view(), name='api_customer_search'),
]