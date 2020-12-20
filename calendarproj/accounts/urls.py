# accounts/urls.py
from django.urls import path

from .views import SignUpView


urlpatterns = [
    path('createaccount/', SignUpView.as_view(), name='createaccount'),
]