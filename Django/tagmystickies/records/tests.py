
# Create your tests here.
import json
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.test import TestCase
from records.models import UserEntry, StickerTagEntry
from rest_framework.test import APITestCase
from records.serializers import UserEntrySerializer, StickerTagEntrySerializer
from records.models import UserEntry, StickerTagEntry

'''
Rather than starting a server and dirtying up a database, these tests allow us to automatically confirm that all our views and models are
working correctly!
'''


class UserEntryModelTest(TestCase):

    def test_userentry_save(self):
        before_count = UserEntry.objects.count()
        # Create a user entry with a status
        user = UserEntry.objects.create(user=1, chat=12345, status="ACTIVE")
        after_count = UserEntry.objects.count()
        # make sure the number of entries increased
        self.assertEqual(after_count-before_count, 1)
        # Check if the status is saved
        self.assertEqual(user.status, "ACTIVE")

    def test_duplicate_user_entry_save(self):
        # make sure there's an error when we try to add two identical users
        with self.assertRaises(IntegrityError):
            user = UserEntry.objects.create(user=1, chat=12345, status="blah")
            user_dup = UserEntry.objects.create(
                user=1, chat=92874659, status="blah")

    def test_duplicate_chats(self):
        # make sure there's an error when we try to add two identical chats, but same user
        with self.assertRaises(IntegrityError):
            UserEntry.objects.create(
                user=69, chat=420, status="original")
            UserEntry.objects.create(
                user=6900, chat=420, status="clone")

    def test_blank_status(self):
        # make sure we can have a blank status
        UserEntry.objects.create(user=6969, chat=297845692)
        self.assertTrue(UserEntry.objects.filter(user=6969).exists())
        self.assertEqual(UserEntry.objects.get(user=6969).status, "")


class StickerTagEntryModelTest(TestCase):

    def test_stickertagentry_save(self):
        # Create a user entry
        user = UserEntry.objects.create(user=2, chat=12346, status="active")

        # Create a sticker tag entry with uppercase letters in the tag
        sticker_entry = StickerTagEntry.objects.create(
            user=user, sticker="sticker1", tag="FUNNY")

        # Check if the tag is saved in lowercase
        self.assertEqual(sticker_entry.tag, "funny")

    def test_stickertagentry_no_duplicate_tags(self):
        user = UserEntry.objects.create(user=99, chat=74683, status="blah")

        StickerTagEntry.objects.create(
            user=user, sticker="my_sticker", tag="cool")
        try:
            StickerTagEntry.objects.create(
                user=user, sticker="my_sticker", tag="cool")
        except ValidationError:
            pass

        result_list = StickerTagEntry.objects.filter(
            user=user, sticker="my_sticker", tag="cool")
        result_list_count = result_list.count()
        self.assertLess(result_list_count, 2)

    def test_stickertagentry_no_special_chars_in_tags(self):
        user = UserEntry.objects.create(
            user=999, chat=3983864538, status="dude")
        with self.assertRaises(ValidationError):
            StickerTagEntry.objects.create(
                user=user, sticker="8237548632584", tag="yo, this tag rocks.\n")


class UserEntrySerializerTest(APITestCase):

    def test_userentry_serializer(self):
        # Create a user entry not in DB
        user = UserEntry(user=1, chat=12345, status="active")

        # Serialize the user entry
        serializer = UserEntrySerializer(user)

        # Check if the serialized data matches the expected output
        expected_data = {
            'user': 1,
            'chat': 12345,
            'status': 'active',
        }

        raw_serializer = UserEntrySerializer(data=expected_data)

        self.assertEqual(serializer.data, expected_data)
        self.assertTrue(raw_serializer.is_valid())
        self.assertEqual(raw_serializer.data, expected_data)

        bad_data = {
            'user': 6969,
        }

        bad_serializer = UserEntrySerializer(data=bad_data)
        self.assertFalse(bad_serializer.is_valid())


class StickerTagEntrySerializerTest(APITestCase):

    def test_stickertagentry_serializer(self):
        # Create a user entry
        user = UserEntry.objects.create(user=2, chat=12346, status="active")

        # Create a sticker tag entry
        sticker_entry = StickerTagEntry.objects.create(
            user=user, sticker="sticker1", tag=" fUnNy ")

        # Serialize the sticker tag entry
        serializer = StickerTagEntrySerializer(sticker_entry)

        # Check if the serialized data matches the expected output
        expected_data = {
            'id': sticker_entry.id,
            'sticker': 'sticker1',
            'user': user.user,  # Using the user's primary key
            'tag': 'funny',
        }

        duplicate_data = {
            'sticker': 'sticker1',
            'user': user.user,  # Using the user's primary key
            'tag': 'funny',
        }

        # Data for creating a new entry
        raw_data = {
            'sticker': 'sticker1',
            'user': user.user,  # Using the user's primary key
            'tag': 'sad',
        }

        # Bad data with special characters in the tag
        bad_data = {
            'sticker': 'sticker1',
            'user': user.user,  # Using the user's primary key
            'tag': 'messed, up\n',
        }

        # Validate the serializer for raw data and bad data
        raw_serializer = StickerTagEntrySerializer(data=raw_data)
        bad_serializer = StickerTagEntrySerializer(data=bad_data)
        duplicate_Serializer = StickerTagEntrySerializer(data=duplicate_data)

        # Check if the serialized data matches the expected output
        self.assertEqual(serializer.data, expected_data)

        # Check if the raw data is valid
        self.assertTrue(raw_serializer.is_valid(),
                        msg=f"Errors: {raw_serializer.errors}")

        # Check if the bad data is invalid
        self.assertFalse(bad_serializer.is_valid(),
                         msg=f"Errors: {bad_serializer.errors}")

        # check if the duplicate data is invalid
        self.assertFalse(duplicate_Serializer.is_valid(),
                         msg=f"Errors: {duplicate_Serializer.errors}")


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
        # Check that the status is saved without leading/trailing whitespace
        self.assertEqual(UserEntry.objects.get(user=2).status, "Inactive")


class StickerTagEntryListTest(APITestCase):

    def setUp(self):
        self.client = APIClient()
        user = UserEntry.objects.create(user=1, chat=12345, status="active")
        StickerTagEntry.objects.create(
            user=user, sticker="sticker1", tag=" FUNNY ")

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

    def test_create_bad_stickertagentries(self):
        user = UserEntry.objects.get(user=1)
        bad_data = {
            "user": user.user,
            "sticker": "asdfobuiadsio",
            "tag": "cool tag\n"
        }
        good_data = {
            "user": user.user,
            "sticker": "asdfobuiadsio",
            "tag": "righteous"
        }
        # post some bad data (special character and space in tag)
        bad_data_response = self.client.post(
            '/records/ste/', bad_data, format='json')
        # post some good data
        good_data_response = self.client.post(
            '/records/ste/', good_data, format='json')
        # post the same duplicate good data
        duplicate_data_response = self.client.post(
            '/records/ste/', good_data, format='json')
        self.assertNotEqual(bad_data_response.status_code,
                            status.HTTP_201_CREATED)
        self.assertEqual(good_data_response.status_code,
                         status.HTTP_201_CREATED)
        self.assertNotEqual(
            duplicate_data_response.status_code, status.HTTP_201_CREATED)


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
        response = self.client.post(
            '/records/filter-stickers/', {'user': 1, 'tags': [' FUNNY ']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Expect three stickers to be returned
        self.assertEqual(len(response.data['stickers']), 3)
        self.assertEqual(set(response.data['stickers']), {
                         'sticker1', 'sticker3', 'sticker4'})

    def test_filter_stickers_multiple_tags(self):
        response = self.client.post(
            '/records/filter-stickers/', {'user': 1, 'tags': ['FUNNY ', ' serious']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Expect all five stickers to be returned
        self.assertEqual(len(response.data['stickers']), 5)
        self.assertEqual(set(response.data['stickers']), {
                         'sticker1', 'sticker2', 'sticker3', 'sticker4', 'sticker5'})

    def test_filter_stickers_empty_tag_list(self):
        response = self.client.post(
            '/records/filter-stickers/', {'user': 1, 'tags': []})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Expect all five stickers to be returned
        self.assertEqual(len(response.data['stickers']), 5)
        self.assertEqual(set(response.data['stickers']), {
                         'sticker1', 'sticker2', 'sticker3', 'sticker4', 'sticker5'})

    def test_filter_stickers_no_tag_list(self):
        response = self.client.post('/records/filter-stickers/', {'user': 1})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Expect all five stickers to be returned
        self.assertEqual(len(response.data['stickers']), 5)
        self.assertEqual(set(response.data['stickers']), {
                         'sticker1', 'sticker2', 'sticker3', 'sticker4', 'sticker5'})

    def test_filter_stickers_no_results(self):
        response = self.client.post(
            '/records/filter-stickers/', {'user': 1, 'tags': ['nonexistent']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Expect no stickers to be returned
        self.assertEqual(len(response.data['stickers']), 0)

    def test_multiple_stickers_returned_for_shared_tag(self):
        response = self.client.post(
            '/records/filter-stickers/', {'user': 1, 'tags': ['funny']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Expect three stickers to be returned for the 'funny' tag
        self.assertEqual(len(response.data['stickers']), 3)
        self.assertEqual(set(response.data['stickers']), {
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

        data2 = {'status': 'inactive', 'chat': 69420}
        response2 = self.client.patch(
            f'/records/user-entries/{self.user_entry.pk}/', data2, format='json')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

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
        data = {'tag': ' seriOus '}
        response = self.client.patch(
            f'/records/ste/{self.sticker_tag_entry.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.sticker_tag_entry.refresh_from_db()
        self.assertEqual(self.sticker_tag_entry.tag, 'serious')

        data2 = {'sticker': 'apdhphdp'}
        response2 = self.client.patch(
            f'/records/ste/{self.sticker_tag_entry.pk}/', data2, format='json')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        data3 = {'sticker': 'oauwuhif', 'tag': 'serious'}
        response3 = self.client.patch(
            f'/records/ste/{self.sticker_tag_entry.pk}/', data3, format='json')
        self.assertEqual(response3.status_code, status.HTTP_200_OK)

    def test_delete_sticker_tag_entry(self):
        # Delete the sticker tag entry
        response = self.client.delete(
            f'/records/ste/{self.sticker_tag_entry.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Check that the sticker tag entry was deleted
        self.assertFalse(StickerTagEntry.objects.filter(
            pk=self.sticker_tag_entry.pk).exists())


class DeleteStickerTest(APITestCase):
    '''
    This is for testing the ManipulateMultiStickerView View
    '''

    def setUp(self):
        self.client = APIClient()
        self.userEntry = UserEntry.objects.create(user=69000, chat=69000)
        self.stickerEntry11 = StickerTagEntry.objects.create(
            user=self.userEntry, sticker="sticker1", tag="hug")
        self.stickerEntry12 = StickerTagEntry.objects.create(
            user=self.userEntry, sticker="sticker1", tag="happy")
        self.stickerEntry21 = StickerTagEntry.objects.create(
            user=self.userEntry, sticker="sticker2", tag="hug")

    def test_delete_stickers(self):
        response = self.client.delete(
            f'/records/stickers/{self.userEntry.user}/sticker1/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(StickerTagEntry.objects.filter(
            sticker="sticker1", user=self.userEntry.user).exists())

    def test_post_sticker_tags(self):
        data = {"tags_to_add": ["NuTTy", "Cool", "coOl", "Bad, Tag\n", ""]}
        response = self.client.post(
            f'/records/stickers/{self.userEntry.user}/sticker2/', data=json.dumps(data), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(StickerTagEntry.objects.filter(
            sticker="sticker2", tag="nutty", user=self.userEntry).exists())
        self.assertTrue(StickerTagEntry.objects.filter(
            sticker="sticker2", tag="cool", user=self.userEntry).exists())
        response2 = self.client.post(
            f'records/stickers/{self.userEntry.user}/sticker2/')
        self.assertNotEqual(response2.status_code, status.HTTP_200_OK)

    def test_patch_sticker_tags(self):
        data = {
            "tags_to_add": ["rAdIcal", "bad, tag\r", ""],
            "tags_to_remove": [" HUG ", "bad, tag", "", "nonexistent"]
        }
        response = self.client.patch(
            f'/records/stickers/{self.userEntry.user}/sticker2/', data=json.dumps(data), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker2", tag="hug").exists())
        self.assertTrue(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker2", tag="radical").exists())


class MultiStickerTest(APITestCase):
    '''
    This is for testing the MultiStickerView View
    '''

    def setUp(self):
        self.client = APIClient()
        self.userEntry = UserEntry.objects.create(user=69000, chat=69000)
        self.stickerEntry11 = StickerTagEntry.objects.create(
            user=self.userEntry, sticker="sticker1", tag="hug")
        self.stickerEntry12 = StickerTagEntry.objects.create(
            user=self.userEntry, sticker="sticker1", tag="happy")
        self.stickerEntry21 = StickerTagEntry.objects.create(
            user=self.userEntry, sticker="sticker2", tag="hug")

    def test_multi_delete_sticker(self):
        response = self.client.delete(f'/records/stickers/{self.userEntry.user}/', data=json.dumps({"stickers": [
                                      "sticker1", "sticker2", "stickernonexistent", "bad, sticker input\n"]}), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(StickerTagEntry.objects.filter(
            user=self.userEntry.user, sticker="sticker1").exists())
        self.assertFalse(StickerTagEntry.objects.filter(
            user=self.userEntry.user, sticker="sticker2").exists())

        response2 = response = self.client.delete(f'/records/stickers/{self.userEntry.user}/', data=json.dumps({"stickers": [
            "stickernonexistent", "bad, sticker input\n"]}), content_type="application/json")
        self.assertNotEqual(response2.status_code, status.HTTP_204_NO_CONTENT)

    def test_multi_post_sticker(self):
        # Prepare the data for the POST request
        post_data = {
            "stickers": ["sticker3", "sticker4"],
            "tags": ["coOl", " awEsome "]
        }

        # Send the POST request
        response = self.client.post(
            f'/records/stickers/{self.userEntry.user}/',
            data=json.dumps(post_data),
            content_type="application/json"
        )

        # Check if the response is successful
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify that the stickers have been added with the tags
        self.assertTrue(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker3", tag="cool").exists())
        self.assertTrue(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker3", tag="awesome").exists())
        self.assertTrue(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker4", tag="cool").exists())
        self.assertTrue(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker4", tag="awesome").exists())


class DeleteTagSetTest(APITestCase):
    '''
    This is  to test the DeleteTagSetView View
    '''

    def setUp(self):
        self.client = APIClient()
        self.userEntry = UserEntry.objects.create(user=72000, chat=990099)
        StickerTagEntry.objects.create(
            sticker="sticker1", user=self.userEntry, tag="tag1")
        StickerTagEntry.objects.create(
            sticker="sticker1", user=self.userEntry, tag="tag2")
        StickerTagEntry.objects.create(
            sticker="sticker1", user=self.userEntry, tag="tag3")
        StickerTagEntry.objects.create(
            sticker="sticker1", user=self.userEntry, tag="tag4")

    def test_delete(self):
        tags_to_check = ["tag1", "tag2", "tag3", "tag4"]
        data = {"tags_to_remove": ["TAG1", " tag2 ", "tag3", "tag4", "tag5"]}
        response = self.client.delete(
            f'/records/stickers/tags/{self.userEntry.user}/sticker1/', data=json.dumps(data), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(StickerTagEntry.objects.filter(
            tag__in=tags_to_check, user=self.userEntry, sticker="sticker1").exists())


class DeleteTagSetMultiTest(APITestCase):
    '''
    This is to test DeleteMultiTagSetView
    '''

    def setUp(self):
        self.client = APIClient()
        self.userEntry = UserEntry.objects.create(user=72000, chat=990099)
        StickerTagEntry.objects.create(
            sticker="sticker1", user=self.userEntry, tag="tag1")
        StickerTagEntry.objects.create(
            sticker="sticker1", user=self.userEntry, tag="tag2")
        StickerTagEntry.objects.create(
            sticker="sticker2", user=self.userEntry, tag="tag1")
        StickerTagEntry.objects.create(
            sticker="sticker2", user=self.userEntry, tag="tag2")

    def test_delete(self):
        tags_to_check = ["tag1", "tag2"]
        data = {"tags_to_remove": [
            "TAG1", " tag2 ", "tag3", "tag4", "tag5"], "stickers": ["sticker1", "sticker2"]}
        response = self.client.delete(
            f'/records/stickers/tags/multi/{self.userEntry.user}/', data=json.dumps(data), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(StickerTagEntry.objects.filter(
            tag__in=tags_to_check, user=self.userEntry, sticker__in=["sticker1", "sticker2"]).exists())


class MassTagReplaceViewTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.userEntry = UserEntry.objects.create(user=72010, chat=990199)
        StickerTagEntry.objects.create(
            sticker="sticker1", user=self.userEntry, tag="tag1")
        StickerTagEntry.objects.create(
            sticker="sticker1", user=self.userEntry, tag="tag2")
        StickerTagEntry.objects.create(
            sticker="sticker2", user=self.userEntry, tag="tag1")
        StickerTagEntry.objects.create(
            sticker="sticker2", user=self.userEntry, tag="tag2")

    def test_swap(self):
        data = {"tags_to_remove": [" tAg1 ", " tag2 ", "Tag3", "\n"], "tags_to_add": [
            " TAG3 ", "tag4", "bad, tag\n"], "stickers": ["sticker1", "sticker2"]}
        response = self.client.patch(
            f'/records/stickers/tags/mass-replace/{self.userEntry.user}/', data=json.dumps(data), content_type="application/json")
        self.assertTrue(response.status_code, status.HTTP_200_OK)
        self.assertFalse(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker1", tag="tag1").exists())
        self.assertFalse(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker1", tag="tag2").exists())
        self.assertFalse(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker2", tag="tag2").exists())
        self.assertFalse(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker2", tag="tag1").exists())
        self.assertTrue(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker1", tag="tag3").exists())
        self.assertTrue(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker1", tag="tag4").exists())
        self.assertTrue(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker2", tag="tag3").exists())
        self.assertTrue(StickerTagEntry.objects.filter(
            user=self.userEntry, sticker="sticker2", tag="tag4").exists())
