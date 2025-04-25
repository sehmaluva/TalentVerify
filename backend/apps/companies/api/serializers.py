"""
Serializers for the companies app.
"""

from rest_framework import serializers
from ..models import Company, Employee , Department
from datetime import datetime

class EmployeeSerializer(serializers.ModelSerializer):
    """
    Serializer for the Employee model.
    """
    class Meta:
        model = Employee
        fields = ['id', 'name', 'employee_id', 'position', 'company','department'] 
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
    
    def get_company_departments(self, obj):
        if obj.company:
            # Assumes related_name='department' on Department FK to Company
            return [dept.name for dept in obj.company.department.all()]
        return []
    


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
    
    def get_departments(self, obj):
        return [dept.name for dept in obj.department.all()]

    def validate_registration_date(self, value):
        """
        Validate that the registration date is not in the future.
        """
        if value > datetime.now().date():
            raise serializers.ValidationError("Registration date cannot be in the future")
        return value
    """
    def validate_department(self, value):
        
        #Validate that department is a list of strings.
      
        if not isinstance(value, list):
            raise serializers.ValidationError("department must be a list")
        if not all(isinstance(dept, str) for dept in value):
            raise serializers.ValidationError("All department must be strings")
        return value

        """
class DepartmentSerializer(serializers.ModelSerializer):
    total_employees = serializers.SerializerMethodField()
    employees = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'company', 'company_name', 'description', 'total_employees', 'employees']

    def get_total_employees(self, obj):
        return obj.get_total_employees()

    def get_employees(self, obj):
        # Only include active employees in this department
        employees = Employee.objects.filter(department=obj, is_active=True)
        return EmployeeSerializer(employees, many=True).data

    def get_company_name(self, obj):
        return obj.company.name if obj.company else None


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