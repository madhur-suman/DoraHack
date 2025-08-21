from django.urls import path
from . import views

urlpatterns = [
    path('query/', views.chat_query, name='chat_query'),
    path('insights/', views.get_quick_insights, name='get_quick_insights'),
]




