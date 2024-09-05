from django.db import models


class UserEntry(models.Model):
    user = models.IntegerField(primary_key=True)
    chat = models.IntegerField(unique=True, blank=False, null=False)
    status = models.CharField(max_length=50, blank=True, null=True)

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

    # make lowercase before saving
    def save(self, *args, **kwargs):
        if self.sticker:
            self.sticker = self.sticker.strip()
        if self.tag:
            self.tag = self.tag.lower().strip()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['sticker']
