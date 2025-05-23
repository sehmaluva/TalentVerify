"""
Views for the companies app.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from django.db.models import Q
from ..models import Company, Employee, Department
from ..api.serializers import (
    CompanySerializer, EmployeeSerializer,
    CompanyBulkUploadSerializer, EmployeeBulkUploadSerializer,DepartmentSerializer
)
from apps.employees.models import EmployeeHistory
from .permissions import IsAdminRole
import pandas as pd
import json
import re


class CompanyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing company instances.
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    parser_classes = [MultiPartParser, JSONParser]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_upload']:
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Company.objects.all()
        elif user.role == 'company' and hasattr(user, 'company'):
            return Company.objects.filter(id=user.company.id)
        else:
            return Company.objects.all().only('name', 'department')

    def _create_departments(self, company, departments):
        if not departments:
            return
        import re
        if isinstance(departments, list):
            departments = [d.strip() for d in departments if d.strip()]
        else:
            departments = [d.strip() for d in re.split(r'(?:\\n|\n|,|;)+', departments) if d.strip()]
        for dept_name in departments:
            from ..models import Department
            Department.objects.get_or_create(company=company, name=dept_name)

    def perform_create(self, serializer):
        company = serializer.save(created_by=self.request.user)
        departments = self.request.data.get('departments') or self.request.data.get('department')
        self._create_departments(company, departments)
        # --- Create company admin user if admin data is provided ---
        admin_email = self.request.data.get('admin_email')
        admin_username = self.request.data.get('admin_username')
        admin_password = self.request.data.get('admin_password')
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if admin_email and admin_username and admin_password:
            if not User.objects.filter(username=admin_username).exists():
                User.objects.create_user(
                    username=admin_username,
                    email=admin_email,
                    password=admin_password,
                    role='admin',
                    company=company,
                    is_staff=True,
                    is_superuser=True
                )

    def perform_update(self, serializer):
        company = serializer.save()
        departments = self.request.data.get('departments') or self.request.data.get('department')
        self._create_departments(company, departments)

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        serializer = CompanyBulkUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file = serializer.validated_data['file']
        try:
            print('DEBUG bulk_upload: request.user =', request.user, '| is_authenticated =', getattr(request.user, 'is_authenticated', None), '| id =', getattr(request.user, 'id', None))
            if not hasattr(request.user, 'id') or not request.user.is_authenticated:
                return Response({'error': 'Authentication required for bulk upload.'}, status=status.HTTP_401_UNAUTHORIZED)

            df = pd.read_csv(file) if file.name.endswith('.csv') else pd.read_excel(file)
            companies, errors = [], []

            for index, row in df.iterrows():
                try:
                    department = row.get('department', '[]')
                    if isinstance(department, str):
                        try:
                            department = json.loads(department)
                        except json.JSONDecodeError:
                            department = [d.strip() for d in re.split(r',|;', department)]

                    registration_date = pd.to_datetime(row['registration_date']).date()
                    reg_number = str(row['registration_number'])
                    company_data = {
                        'name': row['name'],
                        'registration_date': registration_date,
                        'registration_number': reg_number,
                        'address': row['address'],
                        'contact_person': row['contact_person'],
                        'department': department,
                        'employee_count': int(row.get('employee_count', 0)),
                        'phone': str(row['phone']),
                        'email': row['email'],
                    }

                    from ..models import Company
                    existing_company = Company.objects.filter(registration_number=reg_number).first()
                    if existing_company:
                        # Update existing company
                        for field, value in company_data.items():
                            if field != 'department':
                                setattr(existing_company, field, value)
                        existing_company.save()
                        self._create_departments(existing_company, department)
                        companies.append(self.get_serializer(existing_company).data)
                    else:
                        # Create new company
                        serializer = self.get_serializer(data=company_data)
                        if serializer.is_valid():
                            company = serializer.save(created_by=request.user)
                            self._create_departments(company, department)
                            companies.append(serializer.data)
                        else:
                            errors.append({'row': index + 1, 'errors': serializer.errors})
                except Exception as e:
                    errors.append({'row': index + 1, 'errors': str(e)})

            return Response({
                'message': f'Successfully created {len(companies)} companies',
                'companies': companies,
                'errors': errors
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def update_department(self, request, pk=None):
        company = self.get_object()
        user = request.user
        if user.role != 'admin' and (not hasattr(user, 'company') or user.company.id != company.id):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        department_text = request.data.get('department', '')
        if isinstance(department_text, list):
            # Convert list to a comma-separated string
            department_text = ', '.join(department_text)

        department = [d.strip() for d in re.split(r'(?:\\n|\n|,|;)+', department_text) if d.strip()]
        company.department = ', '.join(department)  # Store as a string
        company.save()
        return Response(self.get_serializer(company).data)


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing employee instances.
    """
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    parser_classes = [MultiPartParser, JSONParser]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_upload']:
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'message': f'Error creating employee: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        # This thing need to be posted to employee app
    def perform_create(self, serializer):
        employee = serializer.save()
        # Handle past work history if provided
        history_data = self.request.data.get('history', [])
        if isinstance(history_data, str):
            import json
            history_data = json.loads(history_data)
        for hist in history_data:
            from apps.companies.models import Company, Department
            company = Company.objects.get(id=hist['company'])
            department = Department.objects.get(id=hist['department'])
            EmployeeHistory.objects.create(
                employee=employee,
                company=company,
                department=department,
                position=hist.get('position', ''),
                start_date=hist.get('start_date'),
                end_date=hist.get('end_date'),
                duties=hist.get('duties', '')
            )
        # Add current job as the latest history (on top)
        EmployeeHistory.objects.create(
            employee=employee,
            company=employee.company,
            department=employee.department,
            position=employee.position,
            start_date=employee.joining_date,
            end_date=None,
            duties=getattr(employee, 'duties', '')
        )
    
    def perform_update(self, serializer):
        from datetime import datetime
        old_data = Employee.objects.get(pk=serializer.instance.pk)
        employee = serializer.save()

        # If company or department changed, update history
        if (old_data.company != employee.company or \
            old_data.department != employee.department or \
            old_data.position != employee.position):

            # Close old history entry
            current_history = EmployeeHistory.objects.filter(
                employee=employee,
                is_current=True
            ).first()

            if current_history:
                current_history.end_date = datetime.now().date()
                current_history.is_current = False
                current_history.save()

            # Create new history entry
            EmployeeHistory.objects.create(
                employee=employee,
                company=employee.company,
                department=employee.department,
                position=employee.position,
                start_date=datetime.now().date(),
                duties=employee.duties,
                is_current=True
            )

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Employee.objects.all()
        elif user.role == 'company' and hasattr(user, 'company'):
            return Employee.objects.filter(company=user.company)
        else:
            return Employee.objects.filter(company=user.company)

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        serializer = EmployeeBulkUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file = serializer.validated_data['file']
        company_id = serializer.validated_data['company_id']

        try:
            company = Company.objects.get(id=company_id)
            df = pd.read_csv(file) if file.name.endswith('.csv') else pd.read_excel(file)
            employees, errors = [], []

            for index, row in df.iterrows():
                try:
                    employee_data = {
                        'company': company.id,
                        'first_name': row['first_name'],
                        'last_name': row['last_name'],
                        'email': row['email'],
                        'phone': str(row['phone']),
                        'date_of_birth': pd.to_datetime(row['date_of_birth']).date(),
                        'gender': row['gender'],
                        'department': row['department'],
                        'position': row['position'],
                        'joining_date': pd.to_datetime(row['joining_date']).date(),
                        'salary': float(row['salary']),
                        'is_active': bool(row.get('is_active', True))
                    }

                    serializer = self.get_serializer(data=employee_data)
                    if serializer.is_valid():
                        serializer.save()
                        employees.append(serializer.data)
                    else:
                        errors.append({'row': index + 1, 'errors': serializer.errors})
                except Exception as e:
                    errors.append({'row': index + 1, 'errors': str(e)})

            return Response({
                'message': f'Successfully created {len(employees)} employees',
                'employees': employees,
                'errors': errors
            }, status=status.HTTP_201_CREATED)

        except Company.DoesNotExist:
            return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def search(self, request):
        # Extract query parameters
        name = request.query_params.get('name', '').strip()
        employer = request.query_params.get('company', '').strip()
        position = request.query_params.get('position', '').strip()
        department = request.query_params.get('department', '').strip()
        year_started = request.query_params.get('year_started', '').strip()
        year_left = request.query_params.get('year_left', '').strip()

        filters = Q()
        if name:
            filters &= Q(first_name__icontains=name) | Q(last_name__icontains=name)
        if employer:
            filters &= Q(company__name__icontains=employer)
        if position:
            filters &= Q(position__icontains=position)
        if department:
            filters &= Q(department__icontains=department)
        if year_started:
            filters &= Q(joining_date__year=year_started)
        if year_left:
            # If you have a 'leaving_date' or equivalent field, use it. Otherwise, skip.
            filters &= Q(leaving_date__year=year_left)

        employees = Employee.objects.filter(filters)
        return Response(self.get_serializer(employees, many=True).data)

    @action(detail=False, methods=['get'])
    def current_at_company(self, request):
        company_id = request.query_params.get('company_id')
        if not company_id:
            return Response({'error': 'company_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        histories = EmployeeHistory.objects.filter(company_id=company_id, end_date__isnull=True)
        return Response(EmployeeSerializer(histories, many=True).data)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        queryset = Department.objects.all()
        company_id = self.request.query_params.get('company', None)
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        return queryset

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        company_id = request.query_params.get('company')
        departments = Department.search(query, company_id)
        serializer = self.get_serializer(departments, many=True)
        return Response(serializer.data)
