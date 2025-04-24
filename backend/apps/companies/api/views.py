"""
Views for the companies app.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from django.db.models import Q
from ..models import Company, Employee
from ..api.serializers import (
    CompanySerializer, EmployeeSerializer,
    CompanyBulkUploadSerializer, EmployeeBulkUploadSerializer
)
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
            return Company.objects.all().only('name', 'departments')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        serializer = CompanyBulkUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file = serializer.validated_data['file']
        try:
            df = pd.read_csv(file) if file.name.endswith('.csv') else pd.read_excel(file)
            companies, errors = [], []

            for index, row in df.iterrows():
                try:
                    departments = row.get('departments', '[]')
                    if isinstance(departments, str):
                        try:
                            departments = json.loads(departments)
                        except json.JSONDecodeError:
                            departments = [d.strip() for d in re.split(r',|;', departments)]

                    registration_date = pd.to_datetime(row['registration_date']).date()
                    company_data = {
                        'name': row['name'],
                        'registration_date': registration_date,
                        'registration_number': str(row['registration_number']),
                        'address': row['address'],
                        'contact_person': row['contact_person'],
                        'departments': departments,
                        'employee_count': int(row.get('employee_count', 0)),
                        'phone': str(row['phone']),
                        'email': row['email'],
                        'created_by': request.user.id
                    }

                    serializer = self.get_serializer(data=company_data)
                    if serializer.is_valid():
                        serializer.save()
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

    @action(detail=True, methods=['post'])
    def update_departments(self, request, pk=None):
        company = self.get_object()
        user = request.user
        if user.role != 'admin' and (not hasattr(user, 'company') or user.company.id != company.id):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        departments_text = request.data.get('departments', '')
        departments = [d.strip() for d in re.split(r'(?:\\n|\n|,|;)+', departments_text) if d.strip()]
        company.departments = departments
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

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Employee.objects.all()
        elif user.role == 'company' and hasattr(user, 'company'):
            return Employee.objects.filter(company=user.company)
        return Employee.objects.none()

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
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.role == 'admin':
            employees = Employee.objects.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query) |
                Q(department__icontains=query)
            )
        elif user.role == 'company' and hasattr(user, 'company'):
            employees = Employee.objects.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query) |
                Q(department__icontains=query),
                company=user.company
            )
        else:
            employees = Employee.objects.none()

        return Response(self.get_serializer(employees, many=True).data)
