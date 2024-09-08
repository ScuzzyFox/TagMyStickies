from django.db import models
from django.core.exceptions import ValidationError

'''
Models are Django's way of representing database objects.
The definitions here affect what's actually in the database and what rules the objects have to follow.
A lot of the time, modifications here require a python manage.py makemigrations records and python manage.py migrate records
'''


class UserEntry(models.Model):
    '''
    User Entry model represents a user in the system. It has an integer user ID, an integer chat ID, and a multi-purpose status string
    '''
    # these are the fields for the model
    user = models.IntegerField(primary_key=True)
    chat = models.IntegerField(unique=True, blank=False, null=False)
    status = models.TextField(blank=True)

    # strip the status of whitespace before saving
    def save(self, *args, **kwargs):
        if self.status:
            self.status = self.status.strip()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['user']


class StickerTagEntry(models.Model):
    '''
    Sticker Tag Entry model represents 1 tag per user per sticker. tags are lower case and can't have certain special characters.
    '''
    sticker = models.CharField(max_length=128)
    user = models.ForeignKey(
        UserEntry, on_delete=models.CASCADE, related_name='stickers')
    tag = models.CharField(max_length=128)
    special_chars = [' ', '\n', '\r', ',', '"']

    class Meta:
        ordering = ['tag', 'user', 'sticker']

    def clean(self):
        # Special characters to check
        special_chars = self.special_chars

        # Strip whitespace and make lowercase
        if self.sticker:
            self.sticker = self.sticker.strip()
        if self.tag:
            self.tag = self.tag.lower().strip()

            # Check for special characters in the tag
            for char in special_chars:
                if char in self.tag:
                    raise ValidationError(
                        f'Special characters {special_chars} are not allowed in the tag.')

        # Check for duplicates
        if StickerTagEntry.objects.filter(user=self.user, sticker=self.sticker, tag=self.tag).exists():
            raise ValidationError(
                "Duplicate tags for the same sticker and user are not allowed.")

    def save(self, *args, **kwargs):
        # Call the clean method to run validations
        self.clean()
        super().save(*args, **kwargs)
