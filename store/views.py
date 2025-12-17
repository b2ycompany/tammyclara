# store/views.py (CÓDIGO COMPLETO)

from rest_framework import generics, status
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404, render 
from decimal import Decimal
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta 

# Importamos os modelos necessários para o processo
from .models import Product, Customer, Sale, SaleItem, Invoice 
from .serializers import ProductSerializer, CustomerSerializer, SaleSerializer, SaleItemSerializer

# --- VIEWS PARA RENDERIZAÇÃO DE TEMPLATES (CORREÇÃO DE ESTABILIDADE) ---
def home_view(request):
    """
    Renderiza o template da página inicial.
    """
    return render(request, 'index.html', {})

def products_view(request):
    """
    Renderiza o template da página de produtos.
    """
    return render(request, 'products.html', {})

def cart_view(request):
    """
    Renderiza o template da página de carrinho.
    """
    return render(request, 'cart.html', {})
    
def order_success_view(request):
    """
    Renderiza a página de sucesso do pedido.
    """
    return render(request, 'order_success.html', {})

def pos_view(request):
    """
    Renderiza o template do Ponto de Venda (PDV) para vendas físicas.
    """
    return render(request, 'pos.html', {})
# ----------------------------------------------------------------------


# --- 1. VIEWS PARA O CATÁLOGO E CLIENTES (Leitura/Criação Simples) ---

class ProductList(generics.ListAPIView):
    """Lista todos os produtos ativos."""
    queryset = Product.objects.filter(is_active=True).order_by('name')
    serializer_class = ProductSerializer

class CustomerCreate(generics.CreateAPIView):
    """Cria um novo cliente (Usado no e-commerce para leads)."""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

# ✅ API para buscar cliente pelo telefone (ESSENCIAL PARA O PDV)
class CustomerSearchByPhone(generics.RetrieveAPIView):
    """
    Busca um cliente existente no CRM pelo número de telefone.
    Usado pelo PDV para preencher dados.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    lookup_field = 'phone_number' 
    
    def get_object(self):
        phone_number = self.kwargs['phone_number']
        try:
            return Customer.objects.get(phone_number=phone_number)
        except Customer.DoesNotExist:
            raise status.HTTP_404_NOT_FOUND

# --- 2. VIEW PARA CRIAÇÃO DE VENDA/PEDIDO (CRM/LEAD) ---

@method_decorator(csrf_exempt, name='dispatch')
class SaleCreate(generics.CreateAPIView):
    """
    Cria uma nova venda (usada pelo e-commerce e PDV).
    Processa itens, dá baixa no estoque e gera fatura em uma transação atômica.
    """
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    
    def create(self, request, *args, **kwargs):
        customer_data = request.data.get('customer_info')
        items_data = request.data.get('items')
        
        if not customer_data or not items_data:
            return Response({"error": "Dados do cliente e/ou itens do pedido estão faltando."}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                
                # 2.1. CLIENTE: CRIA ou ATUALIZA (Lógica de Upsert)
                customer, created = Customer.objects.get_or_create(
                    phone_number=customer_data.get('phone_number'),
                    defaults={
                        'first_name': customer_data.get('first_name', 'Cliente Loja Física'),
                        'email': customer_data.get('email', ''),
                    }
                )
                if not created:
                    customer.first_name = customer_data.get('first_name', customer.first_name)
                    customer.email = customer_data.get('email', customer.email)
                    customer.save()
                    
                # 2.2. VENDA: CRIAÇÃO INICIAL
                sale = Sale.objects.create(
                    customer=customer,
                    sale_date=timezone.now(),
                    total_amount=Decimal('0.00'),
                )
                
                final_total = Decimal('0.00')
                
                # 2.3. ITENS DA VENDA E ATUALIZAÇÃO DE ESTOQUE
                for item_data in items_data:
                    product_id = item_data.get('id')
                    quantity = item_data.get('quantity')
                    product = get_object_or_404(Product, pk=product_id)
                    
                    if quantity <= 0:
                        continue
                        
                    # 🚨 Validação Crítica de Estoque 🚨
                    if product.stock_quantity < quantity:
                        raise ValueError(f"Estoque insuficiente para {product.name}")
                        
                    product.stock_quantity -= quantity
                    product.save()

                    SaleItem.objects.create(
                        sale=sale,
                        product=product,
                        quantity=quantity,
                        price_at_sale=product.price 
                    )
                    final_total += product.price * quantity

                # 2.4. VENDA: ATUALIZAÇÃO FINAL
                sale.total_amount = final_total
                sale.save()
                
                # 2.5. FATURA: CRIAÇÃO AUTOMÁTICA
                Invoice.objects.create(
                    sale=sale,
                    customer=customer, 
                    amount_due=final_total,
                    due_date=timezone.now().date() + timedelta(days=7), 
                    payment_status='PENDING'
                )

                return Response({
                    "message": "Pedido registrado com sucesso!",
                    "sale_id": sale.id,
                }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Ocorreu um erro interno: {str(e)}"}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)