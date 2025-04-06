"""
Custom user model for Talent Verify.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom user model with additional fields for Talent Verify.
    """
    is_employer = models.BooleanField(default=False)
    is_talentverify = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        
    def __str__(self):
        return self.username 