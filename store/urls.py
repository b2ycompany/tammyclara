# CUsersIDocumentsstorestore.py (store/urls.py)

from django.urls import path
from .views import ProductList, SaleCreate, CustomerSearchByPhone
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    # API para listar produtos
    path('products/', ProductList.as_view(), name='product-list'),
    
    # API para submeter o carrinho e checkout (Usado pelo E-commerce e PDV)
    path('checkout/', SaleCreate.as_view(), name='checkout-create'),
    
    # ✅ NOVO: API para buscar cliente por telefone
    path('customer/search/<str:phone_number>/', CustomerSearchByPhone.as_view(), name='customer-search'),
]

urlpatterns = format_suffix_patterns(urlpatterns)