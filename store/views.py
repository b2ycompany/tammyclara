from rest_framework import generics, status
from rest_framework.response import Response
from django.db import transaction
from .models import Product, Customer, Sale, SaleItem
from .serializers import ProductSerializer, CustomerSerializer, SaleSerializer, SaleItemSerializer

# --- 1. VIEWS PARA O CATÁLOGO E CLIENTES (Leitura/Criação Simples) ---

class ProductList(generics.ListAPIView):
    """
    Endpoint para listar todos os produtos ativos. 
    Usado para popular a página de catálogo (products.html).
    """
    queryset = Product.objects.filter(is_active=True).order_by('name')
    serializer_class = ProductSerializer

class CustomerCreate(generics.CreateAPIView):
    """
    Endpoint para criar um novo cliente. 
    Usado no cadastro, newsletter ou no início do checkout.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

# --- 2. VIEW PARA CRIAÇÃO DE VENDA/PEDIDO (A Lógica Central) ---

class SaleCreate(generics.CreateAPIView):
    """
    Endpoint para a cliente submeter o carrinho de compras.
    Isto regista o pedido no backend ANTES do contato via WhatsApp.
    """
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        customer_data = data.get('customer_info')
        items_data = data.get('items')

        # 1. VALIDAÇÃO BÁSICA
        if not customer_data or not items_data:
            return Response({"error": "Dados do cliente e itens são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                
                # 2. PROCURAR OU CRIAR CLIENTE (Usamos o telefone como identificador único)
                phone = customer_data.get('phone_number')
                customer, created = Customer.objects.get_or_create(
                    phone_number=phone,
                    defaults={
                        'first_name': customer_data.get('first_name', 'Cliente'),
                        'email': customer_data.get('email', None),
                        'birth_date': customer_data.get('birth_date', None)
                    }
                )

                # Se o cliente já existia, podemos atualizar o nome/email se necessário
                if not created:
                    customer.first_name = customer_data.get('first_name', customer.first_name)
                    customer.email = customer_data.get('email', customer.email)
                    customer.save()

                # 3. CRIAR A VENDA (Inicialmente marcada como NÃO CONCLUÍDA)
                sale = Sale.objects.create(
                    customer=customer,
                    total_amount=0, # Será recalculado
                    is_completed=False # Pedido Pendente para WhatsApp
                )

                final_total = 0
                sale_items = []

                # 4. PROCESSAR CADA ITEM DO PEDIDO
                for item_data in items_data:
                    product_id = item_data.get('id')
                    quantity = item_data.get('quantity')
                    
                    try:
                        product = Product.objects.get(pk=product_id, is_active=True)
                        if product.stock_quantity < quantity:
                            # Se fosse um e-commerce tradicional, isto retornaria um erro.
                            # Para Venda Personalizada, registamos, mas alertamos que o estoque é baixo.
                            print(f"Alerta: Estoque baixo para {product.name}")
                        
                        item_total = product.price * quantity
                        final_total += item_total

                        # Criar o Item de Venda
                        sale_item = SaleItem(
                            sale=sale,
                            product=product,
                            quantity=quantity,
                            price_at_sale=product.price # Preço atual do produto
                        )
                        sale_items.append(sale_item)
                        
                    except Product.DoesNotExist:
                        # Se o produto não existir, cancelamos a transação
                        raise Exception(f"Produto com ID {product_id} não encontrado ou inativo.")
                
                # Salvar todos os itens de venda de uma vez
                SaleItem.objects.bulk_create(sale_items)
                
                # 5. ATUALIZAR O TOTAL DA VENDA
                sale.total_amount = final_total
                sale.save()
                
                # 6. RESPOSTA DA API (Sucesso)
                # Retornamos os dados da venda criada e o link do WhatsApp
                
                # Base da mensagem WhatsApp para Venda Personalizada
                whatsapp_msg = (
                    f"Olá, LionRising! Novo Pedido (ID: {sale.id}) de {customer.first_name}."
                    f"\n\nContato: {customer.phone_number}"
                    f"\nValor Total: R$ {final_total:.2f}"
                    f"\n\nItens:"
                )
                
                for item in sale_items:
                    whatsapp_msg += (
                        f"\n- {item.product.name} (SKU: {item.product.sku}) "
                        f"x{item.quantity} (R$ {item.price_at_sale:.2f} cada)"
                    )
                
                whatsapp_msg += "\n\nPor favor, contacte o cliente para finalizar e dar baixa no estoque."

                whatsapp_link = (
                    f"https://api.whatsapp.com/send?phone=5542123456789&text={whatsapp_msg}" # MUDAR SEU NÚMERO
                )

                return Response({
                    "message": "Pedido registado com sucesso. Use o WhatsApp para finalizar.",
                    "sale_id": sale.id,
                    "customer_name": customer.first_name,
                    "total": final_total,
                    "whatsapp_link": whatsapp_link
                }, status=status.HTTP_201_CREATED)


        except Exception as e:
            # Captura qualquer erro na transação (ex: produto inválido)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)