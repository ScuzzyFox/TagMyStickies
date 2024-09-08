from django.db import models
from django.core.exceptions import ValidationError


class UserEntry(models.Model):
    user = models.IntegerField(primary_key=True)
    chat = models.IntegerField(unique=True, blank=False, null=False)
    status = models.TextField(blank=True)

    # Make lowercase before saving
    def save(self, *args, **kwargs):
        if self.status:
            self.status = self.status.lower().strip()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['user']


class StickerTagEntry(models.Model):
    sticker = models.CharField(max_length=128)
    user = models.ForeignKey(
        UserEntry, on_delete=models.CASCADE, related_name='stickers')
    tag = models.CharField(max_length=128)
    special_chars = [' ', '\n', '\r', ',', '"']

    class Meta:
        ordering = ['sticker', 'user', 'tag']

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
