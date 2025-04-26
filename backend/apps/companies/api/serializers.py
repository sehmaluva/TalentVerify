"""
Serializers for the companies app.
"""

from rest_framework import serializers
from ..models import Company, Employee , Department
from apps.employees.models import EmployeeHistory
from datetime import datetime

class DepartmentSerializer(serializers.ModelSerializer):
    #total_employees = serializers.SerializerMethodField()
    employees = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'company', 'company_name', 'employees']

    def get_total_employees(self, obj):
        return obj.get_total_employees()

    def get_employees(self, obj):
        # Only include active employees currently in this department
        from apps.employees.models import EmployeeHistory
        histories = EmployeeHistory.objects.filter(department=obj, end_date__isnull=True)
        employees = [h.employee for h in histories if h.employee.is_active]
        from .serializers import EmployeeSerializer as EmpSerializer  # avoid circular import
        return EmpSerializer(employees, many=True).data

    def get_company_name(self, obj):
        return obj.company.name if obj.company else None

class EmployeeHistoryInputSerializer(serializers.Serializer):
    company = serializers.IntegerField()
    department = serializers.IntegerField()
    position = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField(allow_null=True, required=False)
    duties = serializers.CharField(allow_blank=True, required=False)

class EmployeeSerializer(serializers.ModelSerializer):
    """
    Serializer for the Employee model (not EmployeeHistory!).
    """
    history = EmployeeHistoryInputSerializer(many=True, required=False, write_only=True)
    class Meta:
        model = Employee
        fields = [
            'id', 'company', 'department', 'name', 'employee_id', 'email', 'phone', 'date_of_birth',
            'gender', 'joining_date', 'salary', 'position', 'is_active', 'history'
        ]
        read_only_fields = ('id',)

    def validate_date_of_birth(self, value):
        if value > datetime.now().date():
            raise serializers.ValidationError("Date of birth cannot be in the future")
        return value

    def validate_joining_date(self, value):
        if value > datetime.now().date():
            raise serializers.ValidationError("Joining date cannot be in the future")
        return value


class CompanySerializer(serializers.ModelSerializer):
    """
    Serializer for the Company model.
    """
    employees = EmployeeSerializer(many=True, read_only=True)
    current_employees = serializers.SerializerMethodField()
    employee_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at', 'employee_count')
    
    def get_departments(self, obj):
        return [dept.name for dept in obj.department.all()]

    def get_current_employees(self, obj):
        # Employees with a history at this company and end_date is null (current)
        histories = EmployeeHistory.objects.filter(company=obj, end_date__isnull=True)
        employees = [h.employee for h in histories if h.employee is not None]
        return EmployeeSerializer(employees, many=True).data

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