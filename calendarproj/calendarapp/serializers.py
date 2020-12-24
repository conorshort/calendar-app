"""
Serialier from Django rest framework
These simplify the adding, updating, deleting and getting
items from the database
"""



from .models import User, Event
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'shared_with']

    def update(self, instance, validated_data):
        new_shared_with = validated_data.get('shared_with')
        for user in new_shared_with:
            instance.shared_with.add(user.id)
        return instance


class EventSerializer(serializers.ModelSerializer):
    author = UserSerializer()


    author=serializers.CharField(required=False,default=False)
    class Meta:
        model = Event
        exclude = ('event_day', 'shared_with')

    def create(self, validated_data):
        print(validated_data)
        event, created = Event.objects.update_or_create(
            id=validated_data.get('id', None),
            defaults=validated_data)
        return event
