from django.urls import path
from . import views

urlpatterns = [
    # API para listagem de produtos no frontend
    path('products/', views.ProductList.as_view(), name='product-list'),
    
    # API para a cliente submeter o pedido/carrinho
    path('checkout/', views.SaleCreate.as_view(), name='sale-create'),
    
    # API para registo de clientes (ex: newsletter ou novo cadastro)
    path('customers/', views.CustomerCreate.as_view(), name='customer-create'),
]