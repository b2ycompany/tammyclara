from django.db import models
from django.contrib.auth.models import User

# --- 1. PRODUTOS (GESTÃO DE ESTOQUE) ---
class Product(models.Model):
    """
    Define um item de vestuário na loja (Estoque).
    """
    name = models.CharField(max_length=200, verbose_name="Nome do Produto")
    description = models.TextField(verbose_name="Descrição Detalhada")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço de Venda")
    stock_quantity = models.IntegerField(default=0, verbose_name="Quantidade em Estoque")
    size = models.CharField(max_length=10, blank=True, verbose_name="Tamanho (P, M, G, etc.)")
    color = models.CharField(max_length=50, blank=True, verbose_name="Cor")
    sku = models.CharField(max_length=50, unique=True, verbose_name="SKU/Referência Interna")
    is_active = models.BooleanField(default=True, verbose_name="Ativo para Venda")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} ({self.sku})'
    
    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"

# --- 2. CLIENTES (CADASTRO, ANIVERSÁRIOS) ---
class Customer(models.Model):
    """
    Define um cliente para gestão de CRM, vendas personalizadas e aniversários.
    """
    first_name = models.CharField(max_length=100, verbose_name="Primeiro Nome")
    last_name = models.CharField(max_length=100, verbose_name="Sobrenome")
    email = models.EmailField(unique=True, blank=True, null=True, verbose_name="Email")
    phone_number = models.CharField(max_length=20, unique=True, verbose_name="Número de Telefone/WhatsApp")
    birth_date = models.DateField(blank=True, null=True, verbose_name="Data de Aniversário") # Para Campanhas!
    register_date = models.DateTimeField(auto_now_add=True, verbose_name="Data de Cadastro")
    
    def __str__(self):
        return f'{self.first_name} {self.last_name}'

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

# --- 3. VENDA (REGISTRO DA TRANSAÇÃO) ---
class Sale(models.Model):
    """
    Regista uma transação de venda.
    """
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Cliente")
    sale_date = models.DateTimeField(auto_now_add=True, verbose_name="Data da Venda")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor Total")
    is_completed = models.BooleanField(default=False, verbose_name="Venda Fechada (Finalizada)")
    payment_method = models.CharField(max_length=50, blank=True, verbose_name="Método de Pagamento")
    
    def __str__(self):
        return f'Venda #{self.id} - {self.sale_date.strftime("%d/%m/%Y")}'
    
    class Meta:
        verbose_name = "Venda"
        verbose_name_plural = "Vendas"

# --- 4. ITEM DA VENDA (DETALHE DE CADA PRODUTO NA VENDA) ---
class SaleItem(models.Model):
    """
    Detalhe de um produto específico dentro de uma Venda.
    """
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE, verbose_name="Venda")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name="Produto")
    quantity = models.IntegerField(default=1, verbose_name="Quantidade")
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço Unitário na Venda")
    
    def __str__(self):
        return f'{self.quantity}x {self.product.name} na Venda #{self.sale.id}'
    
    class Meta:
        verbose_name = "Item da Venda"
        verbose_name_plural = "Itens da Venda"