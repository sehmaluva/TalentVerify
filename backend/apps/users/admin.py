"""
Admin configuration for the users app.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    """Admin configuration for the custom User model."""
    
    list_display = ('username', 'email', 'role', 'company', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'company')
    search_fields = ('username', 'email', 'company__name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Role and Company', {'fields': ('role', 'company')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'company'),
        }),
    )

admin.site.register(User, CustomUserAdmin) 