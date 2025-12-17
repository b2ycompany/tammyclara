# store/views.py (ARQUIVO COMPLETO)

from rest_framework import generics, status
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404, render 
from decimal import Decimal
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta 

from .models import Product, Customer, Sale, SaleItem, Invoice 
from .serializers import ProductSerializer, CustomerSerializer, SaleSerializer, SaleItemSerializer

def home_view(request):
    return render(request, 'index.html', {})

def products_view(request):
    return render(request, 'products.html', {})

def cart_view(request):
    return render(request, 'cart.html', {})
    
def order_success_view(request):
    return render(request, 'order_success.html', {})

def pos_view(request):
    return render(request, 'pos.html', {})

class ProductList(generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True).order_by('name')
    serializer_class = ProductSerializer

class CustomerCreate(generics.CreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class CustomerSearchByPhone(generics.RetrieveAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    lookup_field = 'phone_number' 
    
    def get_object(self):
        phone_number = self.kwargs['phone_number']
        try:
            return Customer.objects.get(phone_number=phone_number)
        except Customer.DoesNotExist:
            raise status.HTTP_404_NOT_FOUND

@method_decorator(csrf_exempt, name='dispatch')
class SaleCreate(generics.CreateAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    
    def create(self, request, *args, **kwargs):
        customer_data = request.data.get('customer_info')
        items_data = request.data.get('items')
        
        if not customer_data or not items_data:
            return Response({"error": "Dados incompletos."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                customer, created = Customer.objects.get_or_create(
                    phone_number=customer_data.get('phone_number'),
                    defaults={'first_name': customer_data.get('first_name', 'Cliente Loja'), 'email': customer_data.get('email', '')}
                )
                if not created:
                    customer.first_name = customer_data.get('first_name', customer.first_name)
                    customer.email = customer_data.get('email', customer.email)
                    customer.save()
                    
                sale = Sale.objects.create(customer=customer, total_amount=Decimal('0.00'))
                final_total = Decimal('0.00')
                
                for item_data in items_data:
                    product = get_object_or_404(Product, pk=item_data.get('id'))
                    qty = item_data.get('quantity')
                    if product.stock_quantity < qty:
                        raise ValueError(f"Estoque insuficiente para {product.name}")
                    product.stock_quantity -= qty
                    product.save()
                    SaleItem.objects.create(sale=sale, product=product, quantity=qty, price_at_sale=product.price)
                    final_total += product.price * qty

                sale.total_amount = final_total
                sale.save()
                Invoice.objects.create(sale=sale, customer=customer, amount_due=final_total, due_date=timezone.now().date() + timedelta(days=7), payment_status='PENDING')
                return Response({"message": "Sucesso!", "sale_id": sale.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)