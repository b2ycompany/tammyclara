# store/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
import urllib.parse 
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
# ----------------------------------------------------------------------


# --- 1. VIEWS PARA O CATÁLOGO E CLIENTES (Leitura/Criação Simples) ---
# ... (Restante do seu views.py é mantido inalterado) ...
class ProductList(generics.ListAPIView):
# ... (código ProductList) ...
    queryset = Product.objects.filter(is_active=True).order_by('name')
    serializer_class = ProductSerializer

class CustomerCreate(generics.CreateAPIView):
# ... (código CustomerCreate) ...
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

# --- 2. VIEW PARA CRIAÇÃO DE VENDA/PEDIDO (CRM/LEAD) ---

@method_decorator(csrf_exempt, name='dispatch')
class SaleCreate(generics.CreateAPIView):
# ... (código SaleCreate) ...
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
                
                # 2.1. CLIENTE: CRIA ou ATUALIZA
                customer, created = Customer.objects.get_or_create(
                    phone_number=customer_data.get('phone_number'),
                    defaults={
                        'first_name': customer_data.get('first_name', 'Cliente Online'),
                        'email': customer_data.get('email', ''),
                    }
                )
                if not created:
                    customer.first_name = customer_data.get('first_name', customer.first_name)
                    customer.email = customer_data.get('email', customer.email)
                    customer.save()
                    
                # 2.2. VENDA: CRIAÇÃO INICIAL (is_completed=False por padrão)
                sale = Sale.objects.create(
                    customer=customer,
                    sale_date=timezone.now(),
                    total_amount=Decimal('0.00')
                )
                
                final_total = Decimal('0.00')
                
                # 2.3. ITENS DA VENDA E ATUALIZAÇÃO DE ESTOQUE/TOTAL
                for item_data in items_data:
                    product_id = item_data.get('id')
                    quantity = item_data.get('quantity')
                    
                    product = get_object_or_404(Product, pk=product_id)
                    
                    if quantity <= 0:
                        continue
                        
                    # 🚨 Validação de Estoque 🚨
                    if product.stock_quantity < quantity:
                        raise ValueError(
                            f"Não temos {quantity} unidades de '{product.name}' em estoque. "
                            f"Apenas {product.stock_quantity} unidades estão disponíveis."
                        )
                        
                    # Baixa Provisória no Estoque:
                    product.stock_quantity -= quantity
                    product.save()

                    # Cria o item na venda
                    SaleItem.objects.create(
                        sale=sale,
                        product=product,
                        quantity=quantity,
                        price_at_sale=product.price 
                    )
                    
                    final_total += product.price * quantity

                # 2.4. VENDA: ATUALIZAÇÃO FINAL (TOTAL)
                sale.total_amount = final_total
                sale.save()
                
                # 2.5. FATURA: CRIAÇÃO AUTOMÁTICA
                # Cria a fatura/conta a receber
                Invoice.objects.create(
                    sale=sale,
                    customer=customer, 
                    amount_due=final_total,
                    # timedelta está importado corretamente
                    due_date=timezone.now().date() + timedelta(days=7), 
                    payment_status='PENDING'
                )


                # 3. RESPOSTA PARA O FRONTEND (Redirecionamento CRM)
                return Response({
                    "message": "Pedido registrado com sucesso!",
                    "sale_id": sale.id,
                }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            # Captura o erro de Estoque ou Validação e devolve 400
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Qualquer outro erro de processamento
            return Response({"error": f"Ocorreu um erro interno: {str(e)}"}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)