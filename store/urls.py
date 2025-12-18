from django.urls import path
from django.http import HttpResponse
from . import views

# Endpoint de saúde isolado para o Fly.io (Garante que o Proxy libere o site)
def healthz(request):
    return HttpResponse("ok")

urlpatterns = [
    # 1. Health Check
    path('healthz/', healthz, name='healthz'),
    
    # 2. Páginas do Site (Templates) - Nomes corrigidos conforme views.py
    path('', views.home_view, name='home'),
    path('produtos/', views.products_view, name='products'),
    path('carrinho/', views.cart_view, name='cart'),
    path('order-success/', views.order_success_view, name='order_success'),
    path('pdv/', views.pos_view, name='pos'),
    
    # 3. APIs (Utilizando Classes conforme seu views.py)
    path('api/products/', views.ProductList.as_view(), name='api_products'),
    path('api/customer/search/<str:phone_number>/', views.CustomerSearchByPhone.as_view(), name='api_customer_search'),
    path('api/checkout/', views.SaleCreate.as_view(), name='api_checkout'),
]