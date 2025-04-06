"""
Models for the companies app.
"""

from django.db import models
from django.conf import settings

class Company(models.Model):
    """
    Model representing a company in the system.
    """
    name = models.CharField(max_length=255)
    registration_date = models.DateField()
    registration_number = models.CharField(max_length=100, unique=True)
    address = models.TextField()
    contact_person = models.CharField(max_length=255)
    departments = models.JSONField(default=list)
    employee_count = models.IntegerField(default=0)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='companies'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name 