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
    registration_number = models.CharField(max_length=100, unique=True)  # Restored plaintext field
    address = models.TextField()
    contact_person = models.CharField(max_length=255)  # Restored plaintext
    phone = models.CharField(max_length=20)  # Restored plaintext
    email = models.EmailField()  # Restored plaintext
    departments = models.TextField(blank=True, default="[]")
    employee_count = models.IntegerField(default=0, validators=[MinValueValidator(0)])
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
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)  # Save first so it gets a PK

        if not is_new:
            self.employee_count = self.company_employees.count()
            super().save(update_fields=['employee_count'])  # Update only that field


    # def _encrypt_registration_number(self):
    #     pass  # No longer needed, handled by property setter

    # @property
    # def contact_person(self):
    #     if self._encrypted_contact_person:
    #         return self._get_fernet().decrypt(self._encrypted_contact_person).decode()
    #     return None

    # @contact_person.setter
    # def contact_person(self, value):
    #     if value:
    #         self._encrypted_contact_person = self._get_fernet().encrypt(value.encode())
    #     else:
    #         self._encrypted_contact_person = None

    # def _encrypt_contact_person(self):
    #     pass  # No longer needed, handled by property setter

    # @property
    # def phone(self):
    #     if self._encrypted_phone:
    #         return self._get_fernet().decrypt(self._encrypted_phone).decode()
    #     return None

    # @phone.setter
    # def phone(self, value):
    #     if value:
    #         self._encrypted_phone = self._get_fernet().encrypt(value.encode())
    #     else:
    #         self._encrypted_phone = None

    # def _encrypt_phone(self):
    #     pass  # No longer needed, handled by property setter

    # @property
    # def email(self):
    #     if self._encrypted_email:
    #         return self._get_fernet().decrypt(self._encrypted_email).decode()
    #     return None

    # @email.setter
    # def email(self, value):
    #     if value:
    #         self._encrypted_email = self._get_fernet().encrypt(value.encode())
    #     else:
    #         self._encrypted_email = None

    # def _encrypt_email(self):
    #     pass  # No longer needed, handled by property setter

    # @property
    # def decrypted_registration_number(self):
    #     return self.registration_number  # For backward compatibility

    # @property
    # def decrypted_contact_person(self):
    #     return self.contact_person  # For backward compatibility

    # @property
    # def decrypted_phone(self):
    #     return self.phone  # For backward compatibility

    # @property
    # def decrypted_email(self):
    #     return self.email  # For backward compatibility


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
    department = models.ForeignKey('companies.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='curent_employees')
    name = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    position= models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
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
        # Always encrypt sensitive fields before saving
        if self.phone:
            self._encrypt_phone()
        if self.email:
            self._encrypt_email()
        if self.salary:
            self._encrypt_salary()

        # Track history if department/position provided in kwargs
        department = kwargs.pop('department', None)
        position = kwargs.pop('position', None)
        duties = kwargs.pop('duties', '')
        start_date = kwargs.pop('start_date', None)
        end_date = kwargs.pop('end_date', None)

        is_update = self.pk is not None
        old_company = None
        if is_update:
            old = Employee.objects.get(pk=self.pk)
            old_company = old.company

        super().save(*args, **kwargs)

        # Only create/update history if department and position are provided
        if department and position:
            from django.apps import apps
            EmployeeHistory = apps.get_model('employees', 'EmployeeHistory')
            # Close previous history if exists and company/department/position changed
            last_history = EmployeeHistory.objects.filter(employee=self, end_date__isnull=True).first()
            if last_history and (
                last_history.company != self.company or
                last_history.department != department or
                last_history.position != position
            ):
                last_history.end_date = end_date or self.updated_at.date()
                last_history.save()
                # Create new history
                EmployeeHistory.objects.create(
                    employee=self,
                    company=self.company,
                    department=department,
                    position=position,
                    start_date=start_date or self.updated_at.date(),
                    end_date=None,
                    duties=duties or ''
                )
            elif not last_history:
                # No previous history, create new
                EmployeeHistory.objects.create(
                    employee=self,
                    company=self.company,
                    department=department,
                    position=position,
                    start_date=start_date or self.joining_date,
                    end_date=None,
                    duties=duties or ''
                )

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
