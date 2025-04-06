"""
Custom user model for Talent Verify.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError

class User(AbstractUser):
    """
    Custom user model with additional fields for Talent Verify.
    """
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('company', 'Company'),
        ('employee', 'Employee'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        
    def __str__(self):
        return self.username
    
    def clean(self):
        """Validate user data"""
        if self.role == 'company' and not self.company:
            raise ValidationError({'company': 'Company users must be associated with a company.'})
        super().clean()
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def is_admin(self):
        """Check if user is an admin"""
        return self.role == 'admin'
    
    @property
    def is_company_user(self):
        """Check if user is a company user"""
        return self.role == 'company'
    
    @property
    def is_employee(self):
        """Check if user is an employee"""
        return self.role == 'employee' 