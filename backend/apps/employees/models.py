"""
Models for the employees app.
"""

from django.db import models
from django.conf import settings
from apps.companies.models import Company, Department
from apps.companies.models import Employee
from cryptography.fernet import Fernet
import json

class EmployeeHistory(models.Model):
    """
    Model representing an employee's assignment history (position, department, company, dates).
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employee_histories')
    department = models.ForeignKey('companies.Department', on_delete=models.CASCADE, blank=True, null=True,related_name='history_set')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='history')
    position = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)  # null means currently in this role
    duties = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Encrypted fields (optional, for sensitive info)
    _encrypted_employee_id = models.BinaryField(null=True, blank=True)

    class Meta:
        verbose_name = 'Employee History'
        verbose_name_plural = 'Employee Histories'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.name} - {self.company.name} ({self.position})"

    def save(self, *args, **kwargs):
        # Encrypt sensitive data before saving
        if not self._encrypted_employee_id:
            self._encrypt_employee_id()
        super().save(*args, **kwargs)

    def _get_fernet(self):
        key = settings.ENCRYPTION_KEY.encode()
        return Fernet(key)

    def _encrypt_employee_id(self):
        if self.employee and self.employee.employee_id:
            f = self._get_fernet()
            self._encrypted_employee_id = f.encrypt(self.employee.employee_id.encode())

    @property
    def decrypted_employee_id(self):
        if self._encrypted_employee_id:
            f = self._get_fernet()
            return f.decrypt(self._encrypted_employee_id).decode()
        return None