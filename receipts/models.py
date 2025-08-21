from django.db import models
from users.models import User

class ReceiptItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receipt_items')
    receipt_id = models.CharField(max_length=255, null=True, blank=True)
    item_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, null=True, blank=True)
    store_name = models.CharField(max_length=255, null=True, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'receipt_items'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.item_name} - {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.total_amount:
            self.total_amount = self.quantity * self.price
        super().save(*args, **kwargs)

