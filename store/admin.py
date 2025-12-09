from django.contrib import admin
from django.shortcuts import render
from django.urls import path
from django.db.models import F, ExpressionWrapper, DurationField
from django.utils import timezone
from datetime import timedelta
from django.urls import reverse
from django.utils.html import format_html
from decimal import Decimal

# Importamos todos os modelos
from .models import Product, Customer, Sale, SaleItem, ProductImage, Invoice, Bill 


# --- 1. INLINES (Detalhes dentro das páginas Admin) ---

# 1.1. Detalhe de Itens na Venda
class SaleItemInline(admin.TabularInline):
    """Permite adicionar múltiplos itens (produtos) na mesma tela da Venda."""
    model = SaleItem
    extra = 1 
    raw_id_fields = ('product',)

# 1.2. Galeria de Fotos no Produto
class ProductImageInline(admin.TabularInline):
    """Permite adicionar múltiplos uploads de fotos na página de edição do produto."""
    model = ProductImage
    extra = 1 
    fields = ('image', 'is_cover',)
    verbose_name = 'Foto Adicional'
    verbose_name_plural = 'Galeria de Fotos'


# --- 2. REGISTROS ADMIN PADRÃO ---

# 2.1. Vendas
@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'total_amount', 'sale_date', 'is_completed')
    list_filter = ('is_completed', 'sale_date')
    search_fields = ('customer__first_name', 'customer__last_name', 'id')
    inlines = [SaleItemInline]
    readonly_fields = ('total_amount',)

# 2.2. Produtos (Estoque)
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'stock_quantity', 'price', 'is_active', 'size', 'color')
    list_filter = ('is_active', 'size', 'color')
    search_fields = ('name', 'sku')
    list_editable = ('stock_quantity', 'price', 'is_active')
    prepopulated_fields = {'sku': ('name',)}
    
    inlines = [ProductImageInline] 
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'main_image') 
        }),
        ('Detalhes do Estoque', {
            'fields': ('sku', 'price', 'stock_quantity', 'size', 'color', 'is_active')
        }),
    )

# 2.3. Clientes
@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'phone_number', 'register_date')
    search_fields = ('first_name', 'last_name', 'email', 'phone_number')
    readonly_fields = ('register_date',)

# 2.4. Faturas/Contas a Receber
@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'sale', 'amount_due', 'due_date', 'payment_status')
    list_filter = ('payment_status', 'due_date')
    search_fields = ('customer__first_name', 'sale__id')
    raw_id_fields = ('sale', 'customer') 
    list_editable = ('payment_status',)

# 2.5. Contas a Pagar
@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'due_date', 'status', 'payment_date')
    list_filter = ('status', 'due_date')
    search_fields = ('description',)
    list_editable = ('status', 'payment_date')


# --- 3. DASHBOARD DE VENDAS PENDENTES (CRM Pipeline) ---

class CrmDashboardAdmin(admin.AdminSite):
    """
    Cria uma View customizada para o Dashboard de Atendimento ao Cliente.
    """
    site_header = "Dashboard de Vendas (CRM)" 
    site_title = "CRM Dashboard"
    index_title = "Bem-vindo ao CRM de Atendimento"

    def get_urls(self):
        """Adiciona a rota customizada para o Pipeline."""
        urls = super().get_urls()
        custom_urls = [
            path('sales-pipeline/', self.admin_view(self.sales_pipeline), name='sales-pipeline'),
        ]
        return custom_urls + urls

    def sales_pipeline(self, request):
        """Lógica para buscar e formatar as vendas pendentes."""
        now = timezone.now()
        
        pending_sales = Sale.objects.filter(is_completed=False).select_related('customer').annotate(
            time_pending=ExpressionWrapper(now - F('sale_date'), output_field=DurationField())
        ).order_by('-sale_date')

        pipeline_data = []
        for sale in pending_sales:
            total_seconds = sale.time_pending.total_seconds()
            
            hours = int(total_seconds // 3600)
            minutes = int((total_seconds % 3600) // 60)
            
            alert_status = "green"
            if hours >= 4:
                alert_status = "red"
            elif hours >= 1:
                alert_status = "yellow"
            
            # 🚨 CORREÇÃO CRÍTICA: TRATAMENTO DE CLIENTE NULO E EXTRAÇÃO DE DADOS 🚨
            customer_phone = sale.customer.phone_number if sale.customer else 'N/A'
            customer_name = sale.customer.first_name if sale.customer else 'Cliente Deletado'
            
            # Construção do URL do WhatsApp para o botão "Contatar Cliente"
            whatsapp_url = None
            if sale.customer and sale.customer.phone_number != 'N/A': # Verifica se o telefone não é o fallback
                 whatsapp_url = f"https://api.whatsapp.com/send?phone={sale.customer.phone_number}&text=Ol%C3%A1%20{customer_name}%2C%20vimos%20seu%20pedido%20%23{sale.id}%20em%20nossa%20loja.%20Podemos%20finalizar%3F"

            
            change_url = reverse('admin:store_sale_change', args=[sale.id])

            pipeline_data.append({
                'id': sale.id,
                'customer_name': customer_name,
                'customer_phone': customer_phone,
                'amount': sale.total_amount.quantize(Decimal('0.00')),
                'time_pending_str': f"{hours}h {minutes}m",
                'alert_status': alert_status,
                'sale_date': sale.sale_date.strftime("%d/%m/%Y %H:%M"), # 🚨 DATA DA VENDA ADICIONADA 🚨
                'change_url': change_url,
                'whatsapp_url': whatsapp_url,
            })

        context = dict(
           self.each_context(request),
           sales_data=pipeline_data,
           title="Pipeline de Vendas Pendentes (CRM)",
           subtitle=f"{len(pipeline_data)} Leads em Atendimento"
        )
        
        return render(request, "admin/sales_pipeline.html", context)


# 4. INSTANCIAÇÃO E REGISTRO DO NOVO ADMIN SITE
crm_admin_site = CrmDashboardAdmin(name='crm_dashboard')

# Registra os modelos necessários no Admin Customizado
crm_admin_site.register(Sale, SaleAdmin)
crm_admin_site.register(Product, ProductAdmin)
crm_admin_site.register(Customer, CustomerAdmin)
crm_admin_site.register(Invoice, InvoiceAdmin)
crm_admin_site.register(Bill, BillAdmin)