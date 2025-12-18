from django.urls import path
from django.http import HttpResponse
from . import views

# Health Check rápido para o Fly.io
def healthz(request):
    return HttpResponse("ok")

urlpatterns = [
    path('healthz/', healthz, name='healthz'),
    
    # Loja Online: https://tammysstore.com.br/
    path('', views.home_view, name='home'),
    
    # PDV Vendas: https://tammysstore.com.br/pdv/
    path('pdv/', views.pos_view, name='pos'),
    
    # Outras rotas do App
    path('produtos/', views.products_view, name='products'),
    path('carrinho/', views.cart_view, name='cart'),
    path('order-success/', views.order_success_view, name='order_success'),
    
    # APIs para o PDV e Site funcionar
    path('api/products/', views.ProductList.as_view(), name='api_products'),
    path('api/customer/search/<str:phone_number>/', views.CustomerSearchByPhone.as_view(), name='api_customer_search'),
    path('api/checkout/', views.SaleCreate.as_view(), name='api_checkout'),
]