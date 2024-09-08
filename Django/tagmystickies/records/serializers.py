from rest_framework import serializers
from records.models import UserEntry, StickerTagEntry
from django.core.exceptions import ValidationError


# This serializer is responsible for serializing the 'tag' field from the StickerTagEntry model.
# It's a simple serializer since it only deals with a single field, making it reusable if you need to serialize tags elsewhere.
class TagSerializer(serializers.ModelSerializer):

    def validate_tag(self, value):
        """
        Custom validation for the 'tag' field to check for special characters. This is probably not needed in this serializer
        """
        value = value.strip().lower()  # Normalize the tag by stripping whitespace and lowercasing
        for char in self.special_chars:
            if char in value:
                raise ValidationError(
                    f'Special characters {self.special_chars} are not allowed in the tag.')
        return value

    class Meta:
        model = StickerTagEntry
        # Specifies that only the 'tag' field will be included in the serialized output.
        fields = ['tag']


# This serializer handles the serialization of stickers, including their associated tags.
# It uses a custom method field to gather all tags associated with a given sticker and user.
class StickerSerializer(serializers.ModelSerializer):
    # This field will be populated by a method rather than directly from the model.
    tags = serializers.SerializerMethodField()

    class Meta:
        model = StickerTagEntry
        # Specifies that the 'sticker' and 'tags' fields will be included in the serialized output.
        fields = ['sticker', 'tags']

    # Custom method to get all tags associated with the sticker for the specific user.
    # This ensures that only tags belonging to the specific user and sticker combination are retrieved.
    def get_tags(self, obj):
        tags = StickerTagEntry.objects.filter(
            sticker=obj.sticker, user=obj.user).values_list('tag', flat=True)
        return tags


# This serializer is responsible for serializing a user and all their associated stickers.
# It nests the StickerSerializer to include the sticker data and associated tags within the user serialization.
class UserStickerTagSerializer(serializers.ModelSerializer):
    # This field links to the 'stickers' related_name from the UserEntry model,
    # allowing us to access all stickers associated with this user.
    # 'many=True' indicates that this is a one-to-many relationship, so we expect multiple stickers.
    stickers = StickerSerializer(source='stickers', many=True)

    class Meta:
        model = UserEntry
        # Specifies that these fields will be included in the serialized output.
        fields = ['user', 'chat', 'status', 'stickers']


# this serializer is for serializing just user entries
class UserEntrySerializer(serializers.ModelSerializer):
    status = serializers.CharField(
        required=False, allow_blank=True, allow_null=True)

    def validate_status(self, value):
        value = value.strip().lower()
        return value

    def validate(self, data):
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
    special_chars = [' ', '\n', '\r', ',', '"']

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

    def validate(self, data):
        """
        Cross-field validation for duplicates.
        """
        user = data.get('user')
        sticker = data.get('sticker')
        tag = data.get('tag')

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
        fields = ['id', 'sticker', 'user', 'tag']


# just for getting a list of stickers belonging to a user with an optional list of tags
class StickerFilterSerializer(serializers.Serializer):
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
