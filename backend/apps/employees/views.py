"""
Views for the employees app.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Employee
from .serializers import EmployeeSerializer
from .bulk_upload.processor import process_employee_file

class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing employee data.
    """
    serializer_class = EmployeeSerializer
    parser_classes = [MultiPartParser, JSONParser]
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Get the list of items for this view.
        This must be filtered based on user's role:
        - Admin users can see all employees
        - Company users can only see their company's employees
        - Regular users can only search public employee data
        """
        user = self.request.user
        if user.is_admin:
            return Employee.objects.all()
        elif user.is_company_user:
            return Employee.objects.filter(company=user.company)
        else:
            # Regular users can only search, handled in search action
            return Employee.objects.none()
    
    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """
        Handle bulk upload of employee data.
        """
        if not request.user.is_company_user and not request.user.is_admin:
            return Response(
                {"error": "Only company users and admins can upload employee data"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        file = request.FILES.get('file')
        if not file:
            return Response(
                {"error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        company_id = request.user.company.id if request.user.is_company_user else request.data.get('company')
        if not company_id:
            return Response(
                {"error": "Company ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        employees, errors = process_employee_file(file, company_id)
        
        return Response({
            "message": f"Processed {len(employees)} employees",
            "created": employees,
            "errors": errors
        })
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search employees based on various criteria.
        """
        # Get search parameters
        name = request.query_params.get('name')
        employer = request.query_params.get('employer')
        position = request.query_params.get('position')
        department = request.query_params.get('department')
        year_started = request.query_params.get('year_started')
        year_left = request.query_params.get('year_left')
        
        # Build query
        queryset = Employee.objects.all()
        
        if name:
            queryset = queryset.filter(name__icontains=name)
        
        if employer:
            queryset = queryset.filter(company__name__icontains=employer)
        
        if position:
            queryset = queryset.filter(roles__contains=[position])
        
        if department:
            queryset = queryset.filter(departments__contains=[department])
        
        if year_started:
            queryset = queryset.filter(start_dates__contains=[f"{year_started}"])
        
        if year_left:
            queryset = queryset.filter(end_dates__contains=[f"{year_left}"])
        
        # Apply role-based filtering
        user = request.user
        if user.is_company_user:
            queryset = queryset.filter(company=user.company)
        elif not user.is_admin:
            # Regular users can only see basic public info
            queryset = queryset.filter(
                Q(company__isnull=False)  # Must have a company
            ).only('name', 'company', 'departments', 'roles')  # Limited fields
        
        # Serialize and return results
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data) 