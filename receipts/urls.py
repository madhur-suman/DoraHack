from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReceiptItemViewSet

router = DefaultRouter()
router.register(r'', ReceiptItemViewSet, basename='receipt-item')

urlpatterns = [
    path('', include(router.urls)),
]




