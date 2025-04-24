"""
Serializers for the users app.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from apps.companies.models import Company

User = get_user_model()

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        source='company',
        write_only=True,
        required=False
    )

    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email', 
            'first_name', 
            'last_name',
            'role',
            'company',
            'company_id',
            'is_active',
            'date_joined',
            'last_login',
            'password'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

    def validate_role(self, value):
        if value not in ['admin', 'company', 'employee']:
            raise serializers.ValidationError("Invalid role. Must be 'admin', 'company', or 'employee'.")
        return value
    """
    def validate(self, data):
        if data.get('role') == 'company' and not data.get('company'):
            raise serializers.ValidationError({
                'company': 'Company is required for company users.'
            })
        return data
    """
    def validate(self, data):
        # For updates, self.instance is not None
        role = data.get('role', getattr(self.instance, 'role', None))
        company = data.get('company', getattr(self.instance, 'company', None))
        if role == 'company' and not company:
            raise serializers.ValidationError({
                'company_id': 'Company is required for company users.'
            })
        return data

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
        
class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new user."""
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        source='company',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'role', 'company_id')
        extra_kwargs = {
            'role': {'required': True}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
            
        # Validate role and company relationship
        role = attrs.get('role')
        company = attrs.get('company')
        
        if role == 'company' and not company:
            raise serializers.ValidationError({
                'company_id': 'Company is required for company users.'
            })
            
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user 