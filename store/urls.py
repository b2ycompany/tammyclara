from django.urls import path
from django.http import HttpResponse
from . import views

# Health Check para o Fly.io
def healthz(request):
    return HttpResponse("ok")

urlpatterns = [
    path('healthz/', healthz, name='healthz'),
    
    # Rota Principal
    path('', views.home_view, name='home'),
    
    # PDV Vendas
    path('pdv/', views.pos_view, name='pos'),
    
    # ✅ AJUSTADO: Agora bate com o que o navegador pede no seu domínio
    path('products/', views.products_view, name='products'),
    path('cart/', views.cart_view, name='cart'),
    path('order-success/', views.order_success_view, name='order_success'),
    
    # APIs
    path('api/products/', views.ProductList.as_view(), name='api_products'),
    path('api/customer/search/<str:phone_number>/', views.CustomerSearchByPhone.as_view(), name='api_customer_search'),
    path('api/checkout/', views.SaleCreate.as_view(), name='api_checkout'),
]