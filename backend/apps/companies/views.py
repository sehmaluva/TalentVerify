"""
Views for the companies app.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Company
from .serializers import CompanySerializer
from .bulk_upload.processor import process_company_file

class CompanyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing company data.
    """
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Get the list of items for this view.
        This must be filtered based on user's role:
        - Admin users can see all companies
        - Company users can only see their own company
        - Regular users can only see basic company info
        """
        user = self.request.user
        if user.is_admin:
            return Company.objects.all()
        elif user.is_company_user:
            return Company.objects.filter(id=user.company.id)
        else:
            # Regular users can only see basic public info
            return Company.objects.all().only('name', 'departments')
    
    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """
        Handle bulk upload of company data.
        """
        if not request.user.is_admin:
            return Response(
                {"error": "Only admin users can upload company data"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        file = request.FILES.get('file')
        if not file:
            return Response(
                {"error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        companies, errors = process_company_file(file, request.user)
        
        return Response({
            "message": f"Processed {len(companies)} companies",
            "created": companies,
            "errors": errors
        })
    
    @action(detail=True, methods=['post'])
    def update_departments(self, request, pk=None):
        """
        Update company departments.
        """
        company = self.get_object()
        
        if not request.user.is_admin and (not request.user.is_company_user or request.user.company.id != company.id):
            return Response(
                {"error": "You don't have permission to update this company's departments"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        departments = request.data.get('departments', [])
        if not isinstance(departments, list):
            return Response(
                {"error": "Departments must be a list"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        company.departments = departments
        company.save()
        
        serializer = self.get_serializer(company)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_employee_count(self, request, pk=None):
        """
        Update company employee count.
        """
        company = self.get_object()
        
        if not request.user.is_admin and (not request.user.is_company_user or request.user.company.id != company.id):
            return Response(
                {"error": "You don't have permission to update this company's employee count"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            employee_count = int(request.data.get('employee_count', 0))
            if employee_count < 0:
                raise ValueError("Employee count cannot be negative")
        except (TypeError, ValueError) as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        company.employee_count = employee_count
        company.save()
        
        serializer = self.get_serializer(company)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """
        Set the created_by field to the current user when creating a company.
        """
        serializer.save(created_by=self.request.user) 