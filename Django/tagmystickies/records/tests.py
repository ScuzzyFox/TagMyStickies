
# Create your tests here.
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.test import TestCase
from records.models import UserEntry, StickerTagEntry
from rest_framework.test import APITestCase
from records.serializers import UserEntrySerializer, StickerTagEntrySerializer
from records.models import UserEntry, StickerTagEntry


class UserEntryModelTest(TestCase):

    def test_userentry_save(self):
        # Create a user entry with a status that has uppercase letters
        user = UserEntry.objects.create(user=1, chat=12345, status="ACTIVE")

        # Check if the status is saved in lowercase
        self.assertEqual(user.status, "active")


class StickerTagEntryModelTest(TestCase):

    def test_stickertagentry_save(self):
        # Create a user entry
        user = UserEntry.objects.create(user=2, chat=12346, status="active")

        # Create a sticker tag entry with uppercase letters in the tag
        sticker_entry = StickerTagEntry.objects.create(
            user=user, sticker="sticker1", tag="FUNNY")

        # Check if the tag is saved in lowercase
        self.assertEqual(sticker_entry.tag, "funny")


class UserEntrySerializerTest(APITestCase):

    def test_userentry_serializer(self):
        # Create a user entry
        user = UserEntry(user=1, chat=12345, status="active")

        # Serialize the user entry
        serializer = UserEntrySerializer(user)

        # Check if the serialized data matches the expected output
        expected_data = {
            'user': 1,
            'chat': 12345,
            'status': 'active',
        }
        self.assertEqual(serializer.data, expected_data)


class StickerTagEntrySerializerTest(APITestCase):

    def test_stickertagentry_serializer(self):
        # Create a user entry
        user = UserEntry.objects.create(user=2, chat=12346, status="active")

        # Create a sticker tag entry
        sticker_entry = StickerTagEntry.objects.create(
            user=user, sticker="sticker1", tag="funny")

        # Serialize the sticker tag entry
        serializer = StickerTagEntrySerializer(sticker_entry)

        # Check if the serialized data matches the expected output
        expected_data = {
            'id': sticker_entry.id,
            'sticker': 'sticker1',
            'user': user.user,
            'tag': 'funny',
        }
        self.assertEqual(serializer.data, expected_data)


class UserEntryListTest(APITestCase):

    def setUp(self):
        self.client = APIClient()
        # Create a sample user entry
        UserEntry.objects.create(user=1, chat=12345, status="active")

    def test_get_userentry_list(self):
        response = self.client.get('/records/user-entries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # One user should be returned

    def test_create_userentry(self):
        data = {
            "user": 2,
            "chat": 12346,
            "status": "  Inactive  "  # Test with leading and trailing whitespace
        }
        response = self.client.post(
            '/records/user-entries/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(UserEntry.objects.count(), 2)
        # Check that the status is saved without leading/trailing whitespace and in lowercase
        self.assertEqual(UserEntry.objects.get(user=2).status, "inactive")


class StickerTagEntryListTest(APITestCase):

    def setUp(self):
        self.client = APIClient()
        user = UserEntry.objects.create(user=1, chat=12345, status="active")
        StickerTagEntry.objects.create(
            user=user, sticker="sticker1", tag="funny")

    def test_get_stickertagentry_list(self):
        response = self.client.get('/records/ste/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # One sticker should be returned
        self.assertEqual(len(response.data), 1)

    def test_create_stickertagentry(self):
        user = UserEntry.objects.get(user=1)
        data = {
            "user": user.user,
            "sticker": "  sticker2  ",  # Test with leading and trailing whitespace
            "tag": "  Serious  "        # Test with leading and trailing whitespace
        }
        response = self.client.post('/records/ste/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StickerTagEntry.objects.count(), 2)
        # Check that the tag and sticker are saved without leading/trailing whitespace and tag is lowercase
        self.assertEqual(StickerTagEntry.objects.get(
            sticker="sticker2").tag, "serious")
        self.assertEqual(StickerTagEntry.objects.get(
            sticker="sticker2").sticker, "sticker2")


class FilterStickersViewTest(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = UserEntry.objects.create(
            user=1, chat=12345, status="active")

        # Create several stickers with various tags
        StickerTagEntry.objects.create(
            user=self.user, sticker="sticker1", tag="funny")
        StickerTagEntry.objects.create(
            user=self.user, sticker="sticker2", tag="serious")
        StickerTagEntry.objects.create(
            user=self.user, sticker="sticker3", tag="funny")
        StickerTagEntry.objects.create(
            user=self.user, sticker="sticker4", tag="funny")
        StickerTagEntry.objects.create(
            user=self.user, sticker="sticker5", tag="serious")

    def test_filter_stickers_single_tag(self):
        # Test filtering with a single tag (funny)
        response = self.client.post(
            '/records/filter-stickers/', {'user': 1, 'tags': ['funny']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Three stickers should be returned
        self.assertEqual(len(response.data), 3)
        self.assertEqual(set([sticker['sticker'] for sticker in response.data]), {
                         'sticker1', 'sticker3', 'sticker4'})

    def test_filter_stickers_multiple_tags(self):
        # Test filtering with multiple tags (funny and serious)
        response = self.client.post(
            '/records/filter-stickers/', {'user': 1, 'tags': ['funny', 'serious']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # All five stickers should be returned
        self.assertEqual(len(response.data), 5)
        self.assertEqual(set([sticker['sticker'] for sticker in response.data]), {
                         'sticker1', 'sticker2', 'sticker3', 'sticker4', 'sticker5'})

    def test_filter_stickers_empty_tag_list(self):
        # Test filtering with an empty tag list (should return all stickers)
        response = self.client.post(
            '/records/filter-stickers/', {'user': 1, 'tags': []})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # All five stickers should be returned
        self.assertEqual(len(response.data), 5)
        self.assertEqual(set([sticker['sticker'] for sticker in response.data]), {
                         'sticker1', 'sticker2', 'sticker3', 'sticker4', 'sticker5'})

    def test_filter_stickers_no_tag_list(self):
        # Test filtering with no tag list (should return all stickers)
        response = self.client.post('/records/filter-stickers/', {'user': 1})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # All five stickers should be returned
        self.assertEqual(len(response.data), 5)
        self.assertEqual(set([sticker['sticker'] for sticker in response.data]), {
                         'sticker1', 'sticker2', 'sticker3', 'sticker4', 'sticker5'})

    def test_filter_stickers_no_results(self):
        # Test filtering with a tag that doesn't exist
        response = self.client.post(
            '/records/filter-stickers/', {'user': 1, 'tags': ['nonexistent']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # No stickers should be returned
        self.assertEqual(len(response.data), 0)

    def test_multiple_stickers_returned_for_shared_tag(self):
        # Test multiple stickers returned when they share the same tag (funny)
        response = self.client.post(
            '/records/filter-stickers/', {'user': 1, 'tags': ['funny']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Three stickers should be returned for the 'funny' tag
        self.assertEqual(len(response.data), 3)
        self.assertEqual(set([sticker['sticker'] for sticker in response.data]), {
                         'sticker1', 'sticker3', 'sticker4'})


class UserEntryDetailTest(APITestCase):

    def setUp(self):
        self.client = APIClient()
        # Create a sample UserEntry
        self.user_entry = UserEntry.objects.create(
            user=1, chat=12345, status="active")

    def test_retrieve_user_entry(self):
        # Retrieve the user entry
        response = self.client.get(
            f'/records/user-entries/{self.user_entry.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user'], self.user_entry.user)
        self.assertEqual(response.data['chat'], self.user_entry.chat)

    def test_update_user_entry(self):
        # Update the user entry
        data = {'status': 'inactive'}
        response = self.client.patch(
            f'/records/user-entries/{self.user_entry.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user_entry.refresh_from_db()
        self.assertEqual(self.user_entry.status, 'inactive')

    def test_delete_user_entry(self):
        # Delete the user entry
        response = self.client.delete(
            f'/records/user-entries/{self.user_entry.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Check that the user entry was deleted
        self.assertFalse(UserEntry.objects.filter(
            pk=self.user_entry.pk).exists())


class StickerTagEntryDetailTest(APITestCase):

    def setUp(self):
        self.client = APIClient()
        # Create a sample UserEntry and StickerTagEntry
        self.user_entry = UserEntry.objects.create(
            user=1, chat=12345, status="active")
        self.sticker_tag_entry = StickerTagEntry.objects.create(
            user=self.user_entry, sticker="sticker1", tag="funny")

    def test_retrieve_sticker_tag_entry(self):
        # Retrieve the sticker tag entry
        response = self.client.get(
            f'/records/ste/{self.sticker_tag_entry.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sticker'],
                         self.sticker_tag_entry.sticker)
        self.assertEqual(response.data['tag'], self.sticker_tag_entry.tag)

    def test_update_sticker_tag_entry(self):
        # Update the sticker tag entry
        data = {'tag': 'serious'}
        response = self.client.patch(
            f'/records/ste/{self.sticker_tag_entry.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.sticker_tag_entry.refresh_from_db()
        self.assertEqual(self.sticker_tag_entry.tag, 'serious')

    def test_delete_sticker_tag_entry(self):
        # Delete the sticker tag entry
        response = self.client.delete(
            f'/records/ste/{self.sticker_tag_entry.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Check that the sticker tag entry was deleted
        self.assertFalse(StickerTagEntry.objects.filter(
            pk=self.sticker_tag_entry.pk).exists())
