from django.urls import path
from . import views

urlpatterns = [
    path('process/', views.process_receipt, name='process_receipt'),
]



