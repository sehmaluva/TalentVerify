"""
URL patterns for the companies API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, EmployeeViewSet, DepartmentViewSet

router = DefaultRouter()
router.register(r'', CompanyViewSet, basename='company')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'department', DepartmentViewSet, basename='department')

app_name = 'companies'

urlpatterns = [
    path('', include(router.urls)),
] 