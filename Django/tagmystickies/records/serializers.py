from rest_framework import serializers
from records.models import UserEntry, StickerTagEntry
from django.core.exceptions import ValidationError

'''
These serializers are specifically a django rest framework mechanism. They sit in between the database/models and your views.
(Views are like API endpoints). This way the serializer can do some validation logic and format things correctly before taking it from
the database and serving it to a client and vise versa.
You'll notice that some of these serializers look exactly like models.
There are a lot more serializers here than models because we need different serializers for different purposes.

rest framework is a plugin for django that focuses more on just being a RESTful API than serving webpages.
'''


class TagSerializer(serializers.ModelSerializer):
    '''
    this serializer is responsible for serializing the 'tag' field from the StickerTagEntry model.
    '''

    def validate_tag(self, value):
        """
        Custom validation for the 'tag' field to check for special characters. This is probably not needed in this serializer?
        """
        value = value.strip().lower()  # Normalize the tag by stripping whitespace and lowercasing
        for char in self.special_chars:
            if char in value:
                raise ValidationError(
                    f'Special characters {self.special_chars} are not allowed in the tag.')
        return value

    class Meta:
        # this is the model that the serializer deals with
        model = StickerTagEntry
        # Specifies that only the 'tag' field will be included in the serialized output.
        fields = ['tag']


class StickerSerializer(serializers.ModelSerializer):
    '''
    This serializer handles the serialization of stickers, including their associated tags.
    It uses a custom method field to gather all tags associated with a given sticker and user.
    This is meant for read-only operations (display only)
    '''
    # This field will be populated by a method rather than directly from the model.
    tags = serializers.SerializerMethodField()

    class Meta:
        model = StickerTagEntry
        # Specifies that the 'sticker' and 'tags' fields will be included in the serialized output.
        fields = ['sticker', 'tags', "set_name", "file_id"]

    # Custom method to get all tags associated with the sticker for the specific user.
    # This ensures that only tags belonging to the specific user and sticker combination are retrieved.
    def get_tags(self, obj):
        tags = StickerTagEntry.objects.filter(
            sticker=obj.sticker, user=obj.user).values_list('tag', flat=True)
        return tags


class UserStickerTagSerializer(serializers.ModelSerializer):
    '''
    This serializer is responsible for serializing a user and all their associated stickers.
    It nests the StickerSerializer to include the sticker data and associated tags within the user serialization.
    This is intended to be used as read-only
    '''
    # This field links to the 'stickers' related_name from the UserEntry model,
    # allowing us to access all stickers associated with this user.
    # 'many=True' indicates that this is a one-to-many relationship, so we expect multiple stickers.
    stickers = StickerSerializer(source='stickers', many=True)

    class Meta:
        model = UserEntry
        # Specifies that these fields will be included in the serialized output.
        fields = ['user', 'chat', 'status', 'stickers']


class UserEntrySerializer(serializers.ModelSerializer):
    '''
    this serializer is for serializing just user entry objects
    It's for read and write.
    It's a modelSerializer so it actually gets a lot of the logic from how the model object is set up (UserEntry).
    '''

    # explicitly defining this field here to say that it's not required and can be blank or missing
    status = serializers.CharField(
        required=False, allow_blank=True, allow_null=True)

    def validate_status(self, value):
        '''
        Because this function is named validate_something, it is automatically called when the serializer validates its data against the model's rules. Here, we're just making sure to strip the status of its leading and trailing whitespace before saving it to the database.
        This function is specifically validating the status field.
        '''
        value = value.strip()
        return value

    def validate(self, data):
        '''
        Validates that if we're saving a new user, we cannot have duplicate chat id's because that wouldn't make sense.
        '''
        chat = data.get('chat')

        queryset = UserEntry.objects.filter(chat=chat)

        if self.instance:
            queryset = queryset.exclude(user=self.instance.user)

        if queryset.exists():
            raise ValidationError("Duplicate chats not allowed.")
        return data

    class Meta:
        model = UserEntry
        fields = ['user', 'chat', 'status']


# this serializer is for serializing just sticker tag entries
class StickerTagEntrySerializer(serializers.ModelSerializer):
    '''
    This serializer is for read/write serialization of sticker tag entries.
    '''

    # pulling the special characters list from the model
    special_chars = StickerTagEntry.special_chars

    def validate_tag(self, value):
        """
        Custom validation for the 'tag' field to check for special characters.
        """
        value = value.strip().lower()  # Normalize the tag by stripping whitespace and lowercasing
        for char in self.special_chars:
            if char in value:
                raise ValidationError(
                    f'Special characters {self.special_chars} are not allowed in the tag.')
        return value

    def validate_sticker(self, value):
        """
        Custom validation for the 'sticker' field to strip whitespace.
        """
        return value.strip()  # Strip any leading/trailing whitespace from the sticker

    def validate_file_id(self, value):
        """
        Custom validation for the 'file_id' field to strip whitespace.
        """
        return value.strip()

    def validate_set_name(self, value):
        """
        Custom validation for the 'set_name' field to strip whitespace.
        """
        return value.strip()

    def validate(self, data):
        """
        Cross-field validation for duplicates only if we're saving a new object (not updating an existing one).
        """
        user = data.get('user')
        sticker = data.get('sticker')
        tag = data.get('tag')
        # file_id = data.get('file_id')
        # set_name = data.get('set_name')

        # Check for duplicates, but exclude the current instance if updating
        queryset = StickerTagEntry.objects.filter(
            user=user, sticker=sticker, tag=tag)

        if self.instance:
            # Exclude the current instance from the queryset if updating
            queryset = queryset.exclude(id=self.instance.id)

        if queryset.exists():
            raise ValidationError(
                "Duplicate tags for the same sticker and user are not allowed.")

        return data

    class Meta:
        model = StickerTagEntry
        fields = ['id', 'sticker', 'user', 'tag', 'file_id', 'set_name']


class StickerFilterSerializer(serializers.Serializer):
    '''
    This serializer is useful for the requests that the inline mode of the bot will do.
    i.e. show a user's stickers that fit a set of tags.
    '''
    user = serializers.IntegerField()
    tags = serializers.ListField(child=serializers.CharField(
        max_length=128), required=False, allow_empty=True, allow_null=True)

    def validate_tags(self, value):
        new_array = [tag.strip().lower() for tag in value]
        validated_list = []
        for item in new_array:
            for char in StickerTagEntry.special_chars:
                if char in item:
                    pass
                else:
                    validated_list.append(item)

        return validated_list
