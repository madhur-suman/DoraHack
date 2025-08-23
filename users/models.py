from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Existing fields
    email = models.EmailField(unique=True)
    
    # Civic Auth fields
    civic_user_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    auth_method = models.CharField(
        max_length=20, 
        choices=[
            ('jwt', 'JWT'),
            ('civic', 'Civic'),
            ('civic_email', 'Civic Email'),
            ('civic_google', 'Civic Google'),
            ('civic_wallet', 'Civic Wallet'),
        ],
        default='jwt'
    )
    wallet_address = models.CharField(max_length=255, blank=True, null=True)
    civic_metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return self.username or self.email

