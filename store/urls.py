from django.urls import path
from .views import (
    home_view, products_view, cart_view, 
    order_success_view, pos_view, ProductList, 
    SaleCreate, CustomerSearchByPhone
)
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    # Site Principal
    path('', home_view, name='home'),
    path('products/', products_view, name='products'),
    path('cart/', cart_view, name='cart'),
    path('order-success/', order_success_view, name='order-success'),
    
    # PDV (Frente de Caixa)
    path('pdv/', pos_view, name='pos-view'),

    # APIs (Catálogo, Checkout e CRM)
    path('api/products/', ProductList.as_view(), name='product-list'),
    path('api/checkout/', SaleCreate.as_view(), name='checkout-create'),
    path('api/customer/search/<str:phone_number>/', CustomerSearchByPhone.as_view(), name='customer-search'),
]

urlpatterns = format_suffix_patterns(urlpatterns)