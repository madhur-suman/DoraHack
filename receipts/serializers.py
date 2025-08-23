from rest_framework import serializers
from .models import ReceiptItem

class ReceiptItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceiptItem
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class ReceiptItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceiptItem
        fields = ['receipt_id', 'item_name', 'quantity', 'price', 'category', 'store_name', 'purchase_date']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

