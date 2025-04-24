from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.companies.models import Company
from django.db import transaction
from datetime import date

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates initial admin user, company user, and company'

    def handle(self, *args, **options):
        with transaction.atomic():
            # Create admin user
            admin_user, admin_created = User.objects.get_or_create(
                username='admin',
                defaults={
                    'email': 'admin@talentverify.com',
                    'role': 'admin',
                    'is_staff': True,
                    'is_superuser': True
                }
            )
            if admin_created:
                admin_user.set_password('admin123')
                admin_user.save()
                self.stdout.write(self.style.SUCCESS(f'Admin user created: {admin_user.username}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Admin user already exists: {admin_user.username}'))

            # Create company
            company, company_created = Company.objects.get_or_create(
                name='Talent Verify Inc.',
                defaults={
                    'registration_date': date.today(),
                    'registration_number': 'TV123456',
                    'address': '123 Tech Street, Innovation City',
                    'contact_person': 'John Doe',
                    'department': ['HR', 'IT', 'Finance'],
                    'employee_count': 50,
                    'phone': '+1234567890',
                    'email': 'contact@talentverify.com',
                    'created_by': admin_user
                }
            )
            if company_created:
                self.stdout.write(self.style.SUCCESS(f'Company created: {company.name}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Company already exists: {company.name}'))

            # Create company user
            company_user, company_user_created = User.objects.get_or_create(
                username='company',
                defaults={
                    'email': 'company@talentverify.com',
                    'role': 'company',
                    'company': company
                }
            )
            if company_user_created:
                company_user.set_password('company123')
                company_user.save()
                self.stdout.write(self.style.SUCCESS(f'Company user created: {company_user.username}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Company user already exists: {company_user.username}'))

        self.stdout.write(self.style.SUCCESS('Initial data creation completed successfully')) 