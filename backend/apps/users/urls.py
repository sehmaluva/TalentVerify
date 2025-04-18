"""
URL patterns for the users app.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from ..users import views
from .views import UserList
from backend.settings import LOGGING
import logging


logger = logging.getLogger(__name__)
app_name = 'users'
try:
        

        urlpatterns = [
            path('all/',UserList.as_view() ),
            path('register/', views.UserRegisterView.as_view(), name='register'),
            path('login/', TokenObtainPairView.as_view(), name='login'),
            path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
            path('me/', views.UserProfileView.as_view(), name='profile'),
        ] 
except Exception as e:
                    logger.error(f"An error occurred: {str(e)}", exc_info=True)
                   