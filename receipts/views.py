from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from .models import ReceiptItem
from .serializers import ReceiptItemSerializer, ReceiptItemCreateSerializer

class ReceiptItemViewSet(viewsets.ModelViewSet):
    serializer_class = ReceiptItemSerializer
    
    def get_queryset(self):
        return ReceiptItem.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReceiptItemCreateSerializer
        return ReceiptItemSerializer
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        user_items = self.get_queryset()
        
        stats = {
            'total_items': user_items.count(),
            'total_spent': user_items.aggregate(total=Sum('total_amount'))['total'] or 0,
            'avg_item_price': user_items.aggregate(avg=Avg('price'))['avg'] or 0,
            'total_receipts': user_items.values('receipt_id').distinct().count(),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        user_items = self.get_queryset()
        category_stats = user_items.values('category').annotate(
            count=Count('id'),
            total=Sum('total_amount')
        ).order_by('-total')
        
        return Response(category_stats)
    
    @action(detail=False, methods=['get'])
    def by_store(self, request):
        user_items = self.get_queryset()
        store_stats = user_items.values('store_name').annotate(
            count=Count('id'),
            total=Sum('total_amount')
        ).order_by('-total')
        
        return Response(store_stats)




