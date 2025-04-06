"""
Models for the employees app.
"""

from django.db import models
from django.conf import settings
from apps.companies.models import Company
from cryptography.fernet import Fernet
import json

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
    
    # Encrypted fields
    _encrypted_employee_id = models.BinaryField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.company.name}"
    
    def save(self, *args, **kwargs):
        # Encrypt sensitive data before saving
        if not self._encrypted_employee_id:
            self._encrypt_employee_id()
        super().save(*args, **kwargs)
    
    def _get_fernet(self):
        """Get Fernet instance for encryption/decryption"""
        key = settings.ENCRYPTION_KEY.encode()
        return Fernet(key)
    
    def _encrypt_employee_id(self):
        """Encrypt employee ID"""
        if self.employee_id:
            f = self._get_fernet()
            self._encrypted_employee_id = f.encrypt(self.employee_id.encode())
    
    @property
    def decrypted_employee_id(self):
        """Get decrypted employee ID"""
        if self._encrypted_employee_id:
            f = self._get_fernet()
            return f.decrypt(self._encrypted_employee_id).decode()
        return None
    
    def add_role_history(self, department, role, start_date, end_date=None, duties=None):
        """
        Add a new role history entry for the employee.
        
        Args:
            department: Department name
            role: Role title
            start_date: Date started in role (YYYY-MM-DD)
            end_date: Date left role (YYYY-MM-DD), optional
            duties: List of duties in role, optional
        """
        # Add to departments if not already there
        if department not in self.departments:
            self.departments.append(department)
        
        # Add to roles
        self.roles.append(role)
        
        # Add to start dates
        self.start_dates.append(start_date)
        
        # Add to end dates (None if still in role)
        self.end_dates.append(end_date)
        
        # Add to duties
        if duties is None:
            duties = []
        self.duties.append(duties)
        
        # Save changes
        self.save()
        
        return {
            'department': department,
            'role': role,
            'start_date': start_date,
            'end_date': end_date,
            'duties': duties
        } 