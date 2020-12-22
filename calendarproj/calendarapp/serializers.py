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

        print(instance)
        return instance

    # def update(self, instance, validated_attrs):
    #     new_groups = validated_attrs.get('groups')
    #     for group in new_groups:
    #         instance.groups.add(group)
    #     instance.save()
    #     # below is needed to reflect the group changes in the response
    #     # instance = User.objects.get(id=instance.id)



class EventSerializer(serializers.ModelSerializer):
    author = UserSerializer()

    # id = serializers.IntegerField()
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
