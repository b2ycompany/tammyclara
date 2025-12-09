from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal

# --- 1. PRODUTOS (GESTÃO DE ESTOQUE) ---
class Product(models.Model):
# ... (código inalterado) ...
    name = models.CharField(max_length=200, verbose_name="Nome do Produto")
    description = models.TextField(verbose_name="Descrição Detalhada")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço de Venda")
    stock_quantity = models.IntegerField(default=0, verbose_name="Quantidade em Estoque")
    size = models.CharField(max_length=10, blank=True, verbose_name="Tamanho (P, M, G, etc.)")
    color = models.CharField(max_length=50, blank=True, verbose_name="Cor")
    sku = models.CharField(max_length=50, unique=True, verbose_name="SKU/Referência Interna")
    is_active = models.BooleanField(default=True, verbose_name="Ativo para Venda")
    created_at = models.DateTimeField(auto_now_add=True)

    # Imagem principal
    main_image = models.ImageField(
        upload_to='products/', 
        null=True, 
        blank=True, 
        verbose_name="Imagem Principal"
    )

    def __str__(self):
        return f'{self.name} ({self.sku})'
    
    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"

# --- 1.1 GALERIA DE IMAGENS ---
class ProductImage(models.Model):
# ... (código inalterado) ...
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='images', 
        verbose_name="Produto Relacionado"
    )
    image = models.ImageField(
        upload_to='product_gallery/',
        verbose_name="Foto da Galeria"
    )
    is_cover = models.BooleanField(
        default=False, 
        verbose_name="Foto de Capa (Opcional)"
    )
    
    def __str__(self):
        return f"Imagem para {self.product.name}"
    
    class Meta:
        verbose_name = "Foto Adicional"
        verbose_name_plural = "Galeria de Fotos"


# --- 2. CLIENTES (CRM E ANIVERSÁRIOS) ---
class Customer(models.Model):
# ... (código inalterado) ...
    first_name = models.CharField(max_length=100, verbose_name="Primeiro Nome")
    last_name = models.CharField(max_length=100, verbose_name="Sobrenome")
    email = models.EmailField(unique=True, blank=True, null=True, verbose_name="Email")
    phone_number = models.CharField(max_length=20, unique=True, verbose_name="Número de Telefone/WhatsApp")
    birth_date = models.DateField(blank=True, null=True, verbose_name="Data de Aniversário") 
    register_date = models.DateTimeField(auto_now_add=True, verbose_name="Data de Cadastro")
    
    def __str__(self):
        return f'{self.first_name} {self.last_name}'

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

# --- 3. VENDA (REGISTRO DA TRANSAÇÃO) ---
class Sale(models.Model):
# ... (código inalterado) ...
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Cliente")
    sale_date = models.DateTimeField(default=timezone.now, verbose_name="Data da Venda")
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
# ... (código inalterado) ...
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE, verbose_name="Venda")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name="Produto")
    quantity = models.IntegerField(default=1, verbose_name="Quantidade")
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço Unitário na Venda")
    
    def __str__(self):
        return f'{self.quantity}x {self.product.name} na Venda #{self.sale.id}'
    
    class Meta:
        verbose_name = "Item da Venda"
        verbose_name_plural = "Itens da Venda"


# --- 5. FATURAMENTO E CONTAS A RECEBER (Financeiro) ---
class Invoice(models.Model):
    """
    Representa uma Fatura (Faturamento) gerada a partir de uma venda.
    Serve como registro de Contas a Receber.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('PAID', 'Pago'),
        ('LATE', 'Atrasado'),
    ]

    sale = models.OneToOneField(
        'Sale', 
        on_delete=models.CASCADE, 
        related_name='invoice',
        verbose_name="Venda Relacionada"
    )
    # 🚨 CORREÇÃO CRÍTICA: Adicionar campo customer ao Invoice 🚨
    customer = models.ForeignKey(
        'Customer',
        on_delete=models.PROTECT,
        verbose_name="Cliente da Fatura"
    )

    issue_date = models.DateTimeField(default=timezone.now, verbose_name="Data de Emissão")
    due_date = models.DateField(verbose_name="Data de Vencimento")
    amount_due = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor Devido")
    payment_status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='PENDING',
        verbose_name="Status de Pagamento"
    )
    
    def __str__(self):
        return f'Fatura #{self.id} - Venda #{self.sale.id} - {self.payment_status}'
    
    class Meta:
        verbose_name = "Fatura (Conta a Receber)"
        verbose_name_plural = "Faturas (Contas a Receber)"

# --- 6. CONTAS A PAGAR ---
class Bill(models.Model):
    """
    Representa uma Conta a Pagar (Gastos, Fornecedores, etc.).
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('PAID', 'Pago'),
        ('LATE', 'Atrasado'),
    ]

    description = models.CharField(max_length=255, verbose_name="Descrição")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor")
    due_date = models.DateField(verbose_name="Data de Vencimento")
    payment_date = models.DateField(blank=True, null=True, verbose_name="Data de Pagamento")
    # 🚨 CORREÇÃO CRÍTICA: O campo 'status' é o nome correto 🚨
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='PENDING',
        verbose_name="Status de Pagamento"
    )
    
    def __str__(self):
        return f'{self.description} - R$ {self.amount}'

    class Meta:
        verbose_name = "Conta a Pagar"
        verbose_name_plural = "Contas a Pagar"