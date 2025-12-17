# store/urls.py (CÓDIGO COMPLETO)

from django.urls import path
from .views import ProductList, SaleCreate, CustomerSearchByPhone, pos_view
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    # API para listar produtos
    path('products/', ProductList.as_view(), name='product-list'),
    
    # API para checkout (Usado pelo E-commerce e PDV)
    path('checkout/', SaleCreate.as_view(), name='checkout-create'),
    
    # API para buscar cliente por telefone (Necessário para o PDV)
    path('customer/search/<str:phone_number>/', CustomerSearchByPhone.as_view(), name='customer-search'),
    
    # ✅ Rota para carregar a página do PDV
    path('pdv/', pos_view, name='pos-view'),
]

urlpatterns = format_suffix_patterns(urlpatterns)