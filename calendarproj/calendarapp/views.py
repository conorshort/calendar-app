import datetime as dt
import json

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Event, User
from .serializers import EventSerializer, UserSerializer


@ensure_csrf_cookie
@login_required
def index(request):
    context = {"users": list(User.objects.all())}
    return render(request, 'calendarapp/index.html', context)


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    

class EventViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows events to be viewed or edited.
    """
    queryset = Event.objects.all().order_by('start_time').order_by('event_date')
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    

    def perform_create(self, serializer):
        # Set the author of the created event as the currently signed in user
        serializer.save(author=self.request.user,
                        id=self.request.query_params.get('id'))

    def get_queryset(self):
        """
        This function returns the appropriate events depending on the 
        args given in the get request
        """
        queryset = self.queryset

        day = self.request.query_params.get('day')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        query = self.request.query_params.get('query')

        if (not query) or (not year):

            # Here we get users who have shared their calendar with
            # the current user.
            users = [self.request.user]
            users += list(self.request.user.user_set.all())
            print(users)
            queryset = self.queryset.filter(author__in=users)

            if query:
                return queryset.filter(title__contains=query)

            if day and month and year:
                day, month, year = [int(x) for x in [day, month, year]]
                return queryset.filter(event_date__contains=dt.date(year, month, day))

            if month and year:
                return queryset.filter(event_date__month=month,
                                            event_date__year=year)
        
        return queryset
    

