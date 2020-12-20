import django_filters
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    shared_with = models.ManyToManyField('self', blank=True, symmetrical=False)

class Event(models.Model):
    author = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=200, null=True, blank=True)
    event_day = models.IntegerField(null=True, blank=True)
    event_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    shared_with = models.ManyToManyField(
        get_user_model(), related_name='shared_events', blank=True)


class EventFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr='iexact')

    class Meta:
        model = Event
        fields = {
            'event_date': ['exact', 'month'],
        }
