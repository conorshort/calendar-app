from .models import User, Event
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email']


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        exclude = ('event_day', 'shared_with', 'author')

    def create(self, validated_data):
        print(validated_data)
        event, created = Event.objects.update_or_create(
            id=validated_data.get('id', None),
            defaults=validated_data)
        return event
