"""
Custom permissions for the Talent Verify application.
"""

from rest_framework import permissions

class IsEmployerOrTalentVerify(permissions.BasePermission):
    """
    Custom permission to only allow employers or TalentVerify staff to access the view.
    """
    
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_employer or request.user.is_talentverify))

class IsCompanyOwnerOrTalentVerify(permissions.BasePermission):
    """
    Custom permission to only allow company owners or TalentVerify staff to access the view.
    """
    
    def has_object_permission(self, request, view, obj):
        return bool(
            request.user and
            (request.user.is_talentverify or obj.created_by == request.user)
        ) 