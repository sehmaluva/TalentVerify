"""
Serializers for the companies app.
"""

from rest_framework import serializers
from ..models import Company, Employee
from datetime import datetime

class EmployeeSerializer(serializers.ModelSerializer):
    """
    Serializer for the Employee model.
    """
    class Meta:
        model = Employee
        fields = ['id', 'name', 'employee_id', 'department', 'position', 'company'] 
        read_only_fields = ('created_at', 'updated_at')
    
    def validate_date_of_birth(self, value):
        """
        Validate that the date of birth is not in the future.
        """
        if value > datetime.now().date():
            raise serializers.ValidationError("Date of birth cannot be in the future")
        return value
    
    def validate_joining_date(self, value):
        """
        Validate that the joining date is not in the future.
        """
        if value > datetime.now().date():
            raise serializers.ValidationError("Joining date cannot be in the future")
        return value
    
    def validate(self, data):
        """
        Validate that the employee's department exists in the company's departments.
        """
        company = data.get('company')
        department = data.get('department')
        
        if company and department:
            if department not in company.departments:
                raise serializers.ValidationError({
                    'department': f"Department '{department}' does not exist in the company"
                })
        return data

class CompanySerializer(serializers.ModelSerializer):
    """
    Serializer for the Company model.
    """
    employees = EmployeeSerializer(many=True, read_only=True)
    employee_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at', 'employee_count')
    
    def validate_registration_date(self, value):
        """
        Validate that the registration date is not in the future.
        """
        if value > datetime.now().date():
            raise serializers.ValidationError("Registration date cannot be in the future")
        return value
    """
    def validate_departments(self, value):
        
        #Validate that departments is a list of strings.
      
        if not isinstance(value, list):
            raise serializers.ValidationError("Departments must be a list")
        if not all(isinstance(dept, str) for dept in value):
            raise serializers.ValidationError("All departments must be strings")
        return value

        """

class CompanyBulkUploadSerializer(serializers.Serializer):
    """
    Serializer for bulk uploading companies.
    """
    file = serializers.FileField()
    
    def validate_file(self, value):
        """
        Validate that the uploaded file is a CSV or Excel file.
        """
        if not value.name.endswith(('.csv', '.xlsx', '.xls')):
            raise serializers.ValidationError("File must be a CSV or Excel file")
        return value

class EmployeeBulkUploadSerializer(serializers.Serializer):
    """
    Serializer for bulk uploading employees.
    """
    company_id = serializers.IntegerField()
    file = serializers.FileField()
    
    def validate_file(self, value):
        """
        Validate that the uploaded file is a CSV or Excel file.
        """
        if not value.name.endswith(('.csv', '.xlsx', '.xls')):
            raise serializers.ValidationError("File must be a CSV or Excel file")
        return value
    
    def validate_company_id(self, value):
        """
        Validate that the company exists.
        """
        try:
            Company.objects.get(id=value)
        except Company.DoesNotExist:
            raise serializers.ValidationError("Company does not exist")
        return value 