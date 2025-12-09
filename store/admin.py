from django.contrib import admin
from .models import Product, Customer, Sale, SaleItem

# 1. Painel Personalizado para Itens da Venda (Inline)
# Esta classe permite que você adicione produtos diretamente na página de Venda.
class SaleItemInline(admin.TabularInline):
    """Permite adicionar múltiplos itens (produtos) na mesma tela da Venda."""
    model = SaleItem
    extra = 1 # Mostra 1 campo extra vazio por padrão
    raw_id_fields = ('product',) # Facilita a busca de produtos por ID ou SKU

# 2. Painel Personalizado para Vendas
@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'total_amount', 'sale_date', 'is_completed')
    list_filter = ('is_completed', 'sale_date')
    search_fields = ('customer__first_name', 'customer__last_name', 'id')
    inlines = [SaleItemInline] # Integra a tabela de itens aqui
    readonly_fields = ('total_amount',) # O total será calculado pela lógica (futuramente)

# 3. Painel Personalizado para Produtos (Estoque)
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'stock_quantity', 'price', 'is_active', 'size', 'color')
    list_filter = ('is_active', 'size', 'color')
    search_fields = ('name', 'sku')
    list_editable = ('stock_quantity', 'price', 'is_active') # Edição rápida na lista
    prepopulated_fields = {'sku': ('name',)} # Sugere o SKU baseado no nome

# 4. Painel Personalizado para Clientes (CRM e Aniversários)
@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'phone_number', 'email', 'birth_date', 'register_date')
    search_fields = ('first_name', 'last_name', 'phone_number', 'email')
    list_filter = ('birth_date',) # Permite filtrar por clientes que fazem anos
    date_hierarchy = 'register_date' # Navegação por data de registro