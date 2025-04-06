"""
API views for the companies app.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from ..models import Company
from .serializers import CompanySerializer
import pandas as pd
import json

class CompanyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing company instances.
    """
    serializer_class = CompanySerializer
    parser_classes = [MultiPartParser, JSONParser]
    
    def get_queryset(self):
        """
        This view should return a list of all companies
        for the currently authenticated user.
        """
        user = self.request.user
        if user.is_talentverify:
            return Company.objects.all()
        return Company.objects.filter(created_by=user)
    
    def perform_create(self, serializer):
        """
        Save the company with the current user as creator.
        """
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """
        Handle both single company creation and bulk upload.
        """
        if 'file' in request.FILES:
            return self.bulk_create(request)
        return super().create(request, *args, **kwargs)
    
    def bulk_create(self, request):
        """
        Handle bulk creation of companies from CSV/Excel file.
        """
        file = request.FILES['file']
        
        if file.name.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.name.endswith('.xlsx'):
            df = pd.read_excel(file)
        else:
            return Response(
                {"error": "Unsupported file format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        companies = []
        for _, row in df.iterrows():
            departments = row.get('departments', '[]')
            try:
                if isinstance(departments, str):
                    departments = json.loads(departments)
            except json.JSONDecodeError:
                departments = []
            
            company_data = {
                'name': row['name'],
                'registration_date': row['registration_date'],
                'registration_number': row['registration_number'],
                'address': row['address'],
                'contact_person': row['contact_person'],
                'departments': departments,
                'employee_count': row['employee_count'],
                'phone': row['phone'],
                'email': row['email'],
                'created_by': request.user.id
            }
            
            serializer = self.get_serializer(data=company_data)
            if serializer.is_valid():
                serializer.save()
                companies.append(serializer.data)
            else:
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(companies, status=status.HTTP_201_CREATED) 