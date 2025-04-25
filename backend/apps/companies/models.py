"""
Models for the companies app.
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from cryptography.fernet import Fernet
import json
from datetime import date


class Company(models.Model):
    name = models.CharField(max_length=255)
    registration_date = models.DateField()
    registration_number = models.CharField(max_length=100, unique=True)
    address = models.TextField()
    contact_person = models.CharField(max_length=255)
    # Consider removing this if using Department model instead:
    departments = models.TextField(blank=True, default="[]")
    employee_count = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='companies'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    _encrypted_registration_number = models.BinaryField(null=True, blank=True)
    _encrypted_contact_person = models.BinaryField(null=True, blank=True)
    _encrypted_phone = models.BinaryField(null=True, blank=True)
    _encrypted_email = models.BinaryField(null=True, blank=True)

    class Meta:
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)  # Save first so it gets a PK

        if not is_new:
            self.employee_count = self.company_employees.count()
            super().save(update_fields=['employee_count'])  # Update only that field

    """
    def save(self, *args, **kwargs):
        self.employee_count = self.company_employees.count()
        if not self._encrypted_registration_number:
            self._encrypt_registration_number()
        if not self._encrypted_contact_person:
            self._encrypt_contact_person()
        if not self._encrypted_phone:
            self._encrypt_phone()
        if not self._encrypted_email:
            self._encrypt_email()
        super().save(*args, **kwargs)
    """

    def _get_fernet(self):
        key = settings.ENCRYPTION_KEY.encode()
        return Fernet(key)

    def _encrypt_registration_number(self):
        if self.registration_number:
            self._encrypted_registration_number = self._get_fernet().encrypt(self.registration_number.encode())

    def _encrypt_contact_person(self):
        if self.contact_person:
            self._encrypted_contact_person = self._get_fernet().encrypt(self.contact_person.encode())

    def _encrypt_phone(self):
        if self.phone:
            self._encrypted_phone = self._get_fernet().encrypt(self.phone.encode())

    def _encrypt_email(self):
        if self.email:
            self._encrypted_email = self._get_fernet().encrypt(self.email.encode())

    @property
    def decrypted_registration_number(self):
        if self._encrypted_registration_number:
            return self._get_fernet().decrypt(self._encrypted_registration_number).decode()
        return None

    @property
    def decrypted_contact_person(self):
        if self._encrypted_contact_person:
            return self._get_fernet().decrypt(self._encrypted_contact_person).decode()
        return None

    @property
    def decrypted_phone(self):
        if self._encrypted_phone:
            return self._get_fernet().decrypt(self._encrypted_phone).decode()
        return None

    @property
    def decrypted_email(self):
        if self._encrypted_email:
            return self._get_fernet().decrypt(self._encrypted_email).decode()
        return None


class Department(models.Model):
    """
    Department model associated with a company.
    Name must be unique per company.
    """
    name = models.CharField(max_length=100)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='department')

    class Meta:
        unique_together = ('company', 'name')
        verbose_name = 'Department'
        verbose_name_plural = 'departments'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class Employee(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='company_employees')
    name = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="company_departments")
  # Optional: Change to ForeignKey(Department)
    position = models.CharField(max_length=100)
    joining_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    _encrypted_phone = models.BinaryField(null=True, blank=True)
    _encrypted_email = models.BinaryField(null=True, blank=True)
    _encrypted_salary = models.BinaryField(null=True, blank=True)

    class Meta:
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self._encrypted_phone:
            self._encrypt_phone()
        if not self._encrypted_email:
            self._encrypt_email()
        if not self._encrypted_salary:
            self._encrypt_salary()
        super().save(*args, **kwargs)

    def _get_fernet(self):
        return Fernet(settings.ENCRYPTION_KEY.encode())

    def _encrypt_phone(self):
        if self.phone:
            self._encrypted_phone = self._get_fernet().encrypt(self.phone.encode())

    def _encrypt_email(self):
        if self.email:
            self._encrypted_email = self._get_fernet().encrypt(self.email.encode())

    def _encrypt_salary(self):
        if self.salary:
            self._encrypted_salary = self._get_fernet().encrypt(str(self.salary).encode())

    @property
    def decrypted_phone(self):
        if self._encrypted_phone:
            return self._get_fernet().decrypt(self._encrypted_phone).decode()
        return None

    @property
    def decrypted_email(self):
        if self._encrypted_email:
            return self._get_fernet().decrypt(self._encrypted_email).decode()
        return None

    @property
    def decrypted_salary(self):
        if self._encrypted_salary:
            return self._get_fernet().decrypt(self._encrypted_salary).decode()
        return None
