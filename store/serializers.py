from rest_framework import serializers
from .models import Product, Customer, Sale, SaleItem, ProductImage

# --- 1. Serializer para Galeria de Imagens (ProductImage) ---

class ProductImageSerializer(serializers.ModelSerializer):
    """
    Serializer para as imagens adicionais de um produto.
    """
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'is_cover')

# --- 2. Serializer para Produtos ---

class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer principal para o produto, incluindo a galeria.
    """
    # Adiciona o campo de galeria (related_name='images')
    images = ProductImageSerializer(many=True, read_only=True)
    
    # Campo de preço formatado
    price_formatted = serializers.DecimalField(source='price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'description', 'price', 'price_formatted', 
            'stock_quantity', 'size', 'color', 'sku', 'is_active', 
            'main_image', 'images' 
        )

# --- 3. Serializer para Clientes ---

class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer para o cadastro de clientes.
    """
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ('register_date',)

# --- 4. Serializer para Itens da Venda (SaleItem) ---

class SaleItemSerializer(serializers.ModelSerializer):
    """
    Serializer para detalhe dos itens dentro de uma venda.
    """
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = ('id', 'product', 'product_name', 'product_sku', 'quantity', 'price_at_sale')
        read_only_fields = ('price_at_sale',)

# --- 5. Serializer para Venda (Sale) ---

class SaleSerializer(serializers.ModelSerializer):
    """
    Serializer para a venda principal.
    """
    items = SaleItemSerializer(many=True, read_only=True) # Inclui os itens da venda
    customer_name = serializers.CharField(source='customer.first_name', read_only=True)
    
    class Meta:
        model = Sale
        fields = (
            'id', 'customer', 'customer_name', 'sale_date', 'total_amount', 
            'is_completed', 'payment_method', 'items'
        )
        read_only_fields = ('sale_date', 'total_amount', 'is_completed')