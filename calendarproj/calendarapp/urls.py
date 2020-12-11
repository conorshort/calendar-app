from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    # path('events/date', views.get_events_by_date, name='day'),
    # path('events/month', views.get_events_by_month, name='month'),
]
