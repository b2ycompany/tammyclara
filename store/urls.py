# CUsersIDocumentsstorestore.py (store/urls.py)

from django.urls import path
from .views import ProductList, SaleCreate 
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    # API para listar produtos (products.html) - Agora a única definição
    path('products/', ProductList.as_view(), name='product-list'),
    
    # API para submeter o carrinho e checkout - Agora a única definição
    path('checkout/', SaleCreate.as_view(), name='checkout-create'),
]

urlpatterns = format_suffix_patterns(urlpatterns)