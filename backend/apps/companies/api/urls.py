"""
URL patterns for the companies API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet

router = DefaultRouter()
router.register(r'', CompanyViewSet, basename='company')

app_name = 'companies'

urlpatterns = [
    path('', include(router.urls)),
] 