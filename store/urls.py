# store/urls.py (CÓDIGO COMPLETO)

from django.urls import path
from .views import ProductList, SaleCreate, CustomerSearchByPhone, pos_view
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    # API para listar produtos
    path('api/products/', ProductList.as_view(), name='product-list'),
    
    # API para submeter o checkout (E-commerce e PDV)
    path('api/checkout/', SaleCreate.as_view(), name='checkout-create'),
    
    # API para buscar cliente por telefone (Resolve o ImportError)
    path('api/customer/search/<str:phone_number>/', CustomerSearchByPhone.as_view(), name='customer-search'),
    
    # Rota para o Frente de Caixa (PDV)
    path('pdv/', pos_view, name='pos-view'),
]

urlpatterns = format_suffix_patterns(urlpatterns)