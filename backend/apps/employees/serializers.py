"""
Serializers for the employees app.
"""

from rest_framework import serializers
from .models import Employee

class EmployeeSerializer(serializers.ModelSerializer):
    """
    Serializer for the Employee model.
    """
    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at') 