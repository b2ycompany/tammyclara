from django.urls import path
from .views import ProductList, SaleCreate, CustomerSearchByPhone, pos_view
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    # API para listar produtos
    path('products/', ProductList.as_view(), name='product-list'),
    
    # API para checkout (E-commerce e PDV)
    path('checkout/', SaleCreate.as_view(), name='checkout-create'),
    
    # API para busca de cliente
    path('customer/search/<str:phone_number>/', CustomerSearchByPhone.as_view(), name='customer-search'),
    
    # ✅ Rota para o Ponto de Venda (PDV)
    path('pdv/', pos_view, name='pos-view'),
]

urlpatterns = format_suffix_patterns(urlpatterns)