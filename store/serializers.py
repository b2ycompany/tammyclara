from rest_framework import serializers
from .models import Product, Customer, Sale, SaleItem

# 1. Serializer para o Produto
class ProductSerializer(serializers.ModelSerializer):
    """Serializa os dados do Produto para JSON, usado no catálogo."""
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'description', 'size', 'color', 'stock_quantity', 'sku']

# 2. Serializer para o Cliente
class CustomerSerializer(serializers.ModelSerializer):
    """Serializa os dados do Cliente."""
    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'phone_number', 'email', 'birth_date']
        
# 3. Serializer para Itens de Venda (para detalhe do pedido)
class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = ['product', 'product_name', 'product_sku', 'quantity', 'price_at_sale']

# 4. Serializer para Criação/Consulta de Vendas (Pedidos)
class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True) # Inclui os itens do pedido
    customer_data = CustomerSerializer(source='customer', read_only=True)

    class Meta:
        model = Sale
        fields = ['id', 'customer', 'customer_data', 'sale_date', 'total_amount', 'is_completed', 'items']
        read_only_fields = ['total_amount', 'sale_date', 'is_completed']