"""
Serializers for the companies app.
"""

from rest_framework import serializers
from ..models import Company

class CompanySerializer(serializers.ModelSerializer):
    """
    Serializer for the Company model.
    """
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at') 