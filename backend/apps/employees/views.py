"""
Views for the employees app.
"""

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from .models import Employee
from .serializers import EmployeeSerializer
from .bulk_upload.processor import process_employee_file

class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing employee instances.
    """
    serializer_class = EmployeeSerializer
    parser_classes = [MultiPartParser, JSONParser]
    
    def get_queryset(self):
        """
        This view should return a list of all employees
        for the companies owned by the current user.
        """
        user = self.request.user
        if user.is_talentverify:
            return Employee.objects.all()
        return Employee.objects.filter(company__created_by=user)
    
    def create(self, request, *args, **kwargs):
        """
        Handle both single employee creation and bulk upload.
        """
        if 'file' in request.FILES:
            company_id = request.data.get('company_id')
            if not company_id:
                return Response(
                    {"error": "Company ID is required for bulk upload"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                employees, errors = process_employee_file(request.FILES['file'], company_id)
                response_data = {
                    'created': employees,
                    'errors': errors
                }
                return Response(response_data, status=status.HTTP_201_CREATED)
            except ValueError as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().create(request, *args, **kwargs) 