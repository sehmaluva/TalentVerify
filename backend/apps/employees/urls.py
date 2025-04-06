"""
URL patterns for the employees app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.EmployeeViewSet, basename='employee')

app_name = 'employees'

urlpatterns = [
    path('', include(router.urls)),
] 