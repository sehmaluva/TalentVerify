"""
Models for the employees app.
"""

from django.db import models
from apps.companies.models import Company

class Employee(models.Model):
    """
    Model representing an employee in the system.
    """
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='employees'
    )
    name = models.CharField(max_length=255)
    employee_id = models.CharField(max_length=100, unique=True)
    departments = models.JSONField(default=list)
    roles = models.JSONField(default=list)
    start_dates = models.JSONField(default=list)
    end_dates = models.JSONField(default=list)
    duties = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.company.name}" 