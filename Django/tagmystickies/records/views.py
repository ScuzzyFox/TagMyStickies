from django.shortcuts import render, get_object_or_404
from django.core.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import StickerSerializer, StickerTagEntrySerializer, TagSerializer, UserEntrySerializer, UserStickerTagSerializer, StickerFilterSerializer
from .models import StickerTagEntry, UserEntry
from rest_framework import generics, mixins, status, request

'''
These views are the pieces of code that run when a user makes a request against a url.
Some of theme do a lot of work for you, like the ones that use generics from rest_Framework.

Others are more manual, like the ones using APIView.
'''


class UserEntryList(generics.ListCreateAPIView):
    '''
    lists all user entries or creates a new one (GET and POST). Accepts "user" and "chat" query parameters in the URL for filtering. e.g. ?user=93648736&chat=39463847.

    Supply an object with user field, chat field, and an optional status field when POSTing.
    Example: {"user":1234,"chat":3845,"status":"This is my status".}
    '''
    '''
    the get_queryset function filters the list results against query parameters
    '''

    # this is defined in a specific way so that the generic view can use it
    serializer_class = UserEntrySerializer

    def get_queryset(self):
        '''
        Filters the result list using optionally supplied query parameters in the url
        '''
        user = self.request.query_params.get('user', None)
        chat = self.request.query_params.get('chat', None)
        status = self.request.query_params.get('status', None)
        queryset = UserEntry.objects.all()
        # filter here
        if (user is not None):
            queryset = queryset.filter(user=user)
        if (chat is not None):
            queryset = queryset.filter(chat=chat)
        if (status is not None):
            queryset = queryset.filter(status__icontains=status)
        return queryset


class UserEntryDetail(generics.RetrieveUpdateDestroyAPIView):
    '''
    Deletes, updates, patches, or displays a single, specific user entry
    '''
    queryset = UserEntry.objects.all()
    serializer_class = UserEntrySerializer


class StickerTagEntryList(generics.ListCreateAPIView):
    '''
    lists all the sticker tag entries or creates a new one. Filterable with "tag", "user", "id", and "sticker" query parameters. 
    '''
    serializer_class = StickerTagEntrySerializer

    def get_queryset(self):
        '''
        Filters the result list using optionally supplied query parameters in the url
        '''
        sticker = self.request.query_params.get('sticker', None)
        tag = self.request.query_params.get('tag', None)
        user = self.request.query_params.get('user', None)
        id = self.request.query_params.get('id', None)
        file_id = self.request.query_params.get('file_id', None)
        set_name = self.request.query_params.get('set_name', None)
        queryset = StickerTagEntry.objects.all()
        if id is not None:
            queryset = queryset.filter(id=id)
        if sticker is not None:
            queryset = queryset.filter(sticker__contains=sticker)
        if tag is not None:
            queryset = queryset.filter(tag__icontains=tag)
        if file_id is not None:
            queryset = queryset.filter(file_id__icontains=file_id)
        if set_name is not None:
            queryset = queryset.filter(set_name__icontains=set_name)
        if user is not None:
            try:
                user = int(user)  # Convert user ID to integer
                queryset = queryset.filter(user=user)
            except ValueError:
                queryset = queryset.none()  # Return an empty queryset
        return queryset

    def create(self, request, *args, **kwargs):
        '''
        overloading the create function to do some extra validation.
        In reality this is probably redundant and is a remnant of some earlier testing.
        '''
        # Use try/except to catch ValidationError and return proper response
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StickerTagEntryDetail(generics.RetrieveUpdateDestroyAPIView):
    '''
    Displays, updates, patches, and deletes a specific Sticker tag entry. Just one at a time.
    '''
    queryset = StickerTagEntry.objects.all()
    serializer_class = StickerTagEntrySerializer


class FilterStickersView(APIView):
    '''
    Returns a list of unique stickers belonging to a user, filtered by tags.
    This view is best for the inline part of the telegram bot.
    Note that POST is used instead of GET.
    '''

    def post(self, request):
        user_entry = get_object_or_404(
            UserEntry, user=request.data.get("user", None))
        data = request.data

        try:
            tags = data.get('tags', [])
            exclude_tags = data.get('exclude_tags', [])
            page = data.get('page', 1)

            if tags and len(tags) > 0:
                tags = [tag.lower().strip() for tag in tags]
            if exclude_tags and len(exclude_tags) > 0:
                exclude_tags = [tag.lower().strip() for tag in exclude_tags]

            stickers = StickerTagEntry.objects.filter(user=user_entry.user)

            if tags:
                stickers = stickers.filter(tag__in=tags)
            if exclude_tags:
                stickers = stickers.exclude(tag__in=exclude_tags)

            unique_stickers = list(
                set(sticker.file_id for sticker in stickers))

            # paginate unique_stickers with a max of 50 entries per page
            start = (page - 1) * 50
            end = start + 50
            unique_stickers = unique_stickers[start:end]

            return Response({"stickers": unique_stickers}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def options(self, request, user=None):
        """
        Describe the allowed methods and expected data format for the sticker endpoint.
        """
        return Response(
            {
                "name": "Sticker Retrieval",
                "description": "Retrieve stickers based on tags and pagination",
                "renders": [
                    "application/json",
                ],
                "parses": [
                    "application/json",
                ],
                "allowed_methods": [
                    "POST",
                    "OPTIONS",
                ],
                "actions": {
                    "POST": {
                        "tags": {
                            "type": "array",
                            "required": False,
                            "description": "List of tags to filter stickers"
                        },
                        "exclude_tags": {
                            "type": "array",
                            "required": False,
                            "description": "List of tags to exclude from sticker results"
                        },
                        "page": {
                            "type": "integer",
                            "required": False,
                            "description": "Page number for pagination (default: 1)"
                        }
                    }
                }
            },
            status=status.HTTP_200_OK
        )


class UserStickerTagList(generics.RetrieveAPIView):
    '''
    view a user's complete list of stickers and tags
    '''
    serializer_class = UserStickerTagSerializer
    queryset = UserEntry.objects.all().prefetch_related('stickers__tags')


class ManipulateMultiStickerView(APIView):
    '''
    Some useful multi entry manipulation utility views
    '''

    def post(self, request, user, sticker):
        '''
        Adds a set of tags to 1 user's sticker
        '''
        usr = get_object_or_404(UserEntry, user=user)
        set_name = request.data.get('set_name', None)
        file_id = request.data.get('file_id', None)
        tags_to_add = request.data.get('tags_to_add', None)
        if (tags_to_add is not None and len(tags_to_add) > 0):
            for tag in tags_to_add:
                try:
                    serializer = StickerTagEntrySerializer(
                        data={"user": user, "sticker": sticker, "tag": tag, "file_id": file_id, "set_name": set_name})
                    if not serializer.is_valid(raise_exception=False):
                        continue
                    serializer.save()
                except Exception as e:
                    continue
        else:
            return Response({"error": "Tag list not supplied or is empty"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_200_OK)

    def delete(self, request, user, sticker):
        '''
        Deletes a user's sticker from the database
        '''
        try:
            queryset = StickerTagEntry.objects.filter(
                user=user, sticker=sticker)
            if queryset.exists():
                queryset.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                return Response("Sticker not found for that user.", status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # replace a set of tags with another set

    def patch(self, request, user, sticker):
        '''
        Replaces a set of tags on a sticker with another set (delete, then add)
        '''
        tags_to_remove = request.data.get('tags_to_remove', None)
        tags_to_add = request.data.get('tags_to_add', None)
        file_id = request.data.get('file_id', None)
        set_name = request.data.get('set_name', None)
        if (tags_to_remove is not None):
            validated_tags_to_remove = [tg.lower().strip()
                                        for tg in tags_to_remove]
            StickerTagEntry.objects.filter(
                user=user, tag__in=validated_tags_to_remove, sticker=sticker).delete()
        if (tags_to_add is not None):
            for tag in tags_to_add:
                try:
                    serializer = StickerTagEntrySerializer(
                        data={"user": user, "sticker": sticker, "tag": tag, "file_id": file_id, "set_name": set_name})
                    if not serializer.is_valid():
                        continue
                    serializer.save()
                except:
                    continue
        return Response(status=status.HTTP_200_OK)


class MultiStickerView(APIView):
    '''
    Some more utility functions for manipulating multiple stickers at a time.
    '''

    def post(self, request, user):
        '''
        tag multliple stickers with multiple tags all at once
        '''
        userEntry = get_object_or_404(UserEntry, user=user)
        # stickers may need to be an object that has sticker, file_id, and set_name
        stickers = request.data.get('stickers', None)
        tags = request.data.get('tags', None)
        if (stickers is None) or (len(stickers) == 0):
            return Response({"error": "Sticker list not supplied or is empty."}, status=status.HTTP_400_BAD_REQUEST)
        if (tags is None) or (len(tags) == 0):
            return Response({"error": "Tags list not supplied or is empty."}, status=status.HTTP_400_BAD_REQUEST)
        for sticker in stickers:
            for tag in tags:
                serializer = StickerTagEntrySerializer(
                    data={"user": userEntry.user, "sticker": sticker.get("sticker"), "tag": tag, "file_id": sticker.get("file_id"), "set_name": sticker.get("set_name")})
                if serializer.is_valid():
                    try:
                        serializer.save()
                    except:
                        continue
                else:
                    continue
        return Response(status=status.HTTP_201_CREATED)

    def delete(self, request, user):
        '''
        Delete a list of stickers belonging to a user
        '''
        usr = get_object_or_404(UserEntry, user=user)
        # Ensure the 'stickers' list is provided
        stickers = request.data.get('stickers', None)
        if stickers is None:
            return Response({"error": "Sticker list not supplied."}, status=status.HTTP_400_BAD_REQUEST)

        # Filter for the user's stickers and then filter by the sticker list
        queryset = StickerTagEntry.objects.filter(
            user=usr.user, sticker__in=stickers)

        # Check if the queryset exists and has matching stickers
        if queryset.exists():
            # Delete the stickers found in the queryset
            queryset.delete()
            return Response({"success": "Stickers deleted."}, status=status.HTTP_204_NO_CONTENT)
        else:
            # If no stickers found
            return Response({"error": "No matching stickers found."}, status=status.HTTP_404_NOT_FOUND)


class DeleteTagSetView(APIView):
    '''
    view to delete a set of tags from a sticker 
    '''

    def delete(self, request, user, sticker):
        usr = get_object_or_404(UserEntry, user=user)
        sticker = sticker.strip()
        tags_to_remove = request.data.get('tags_to_remove', None)
        if tags_to_remove is None or len(tags_to_remove) < 1:
            return Response({"error": "tag list not supplied or is empty."}, status=status.HTTP_400_BAD_REQUEST)
        validated_tags_to_remove = [a.lower().strip() for a in tags_to_remove]
        try:
            StickerTagEntry.objects.filter(
                user=usr, sticker=sticker, tag__in=validated_tags_to_remove).delete()
        except Exception as e:
            return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DeleteMultiTagSetView(APIView):
    '''
    view to delete a set of tags from multiple stickers at once
    '''

    def delete(self, request, user):
        usr = get_object_or_404(UserEntry, user=user)
        tags_to_remove = request.data.get('tags_to_remove', None)
        stickers = request.data.get('stickers', None)
        if tags_to_remove is None or len(tags_to_remove) < 1:
            return Response({"error": "tag list not supplied or is empty."}, status=status.HTTP_400_BAD_REQUEST)
        if stickers is None or len(stickers) < 1:
            return Response({"error": "Sticker list not supplied or is empty."}, status=status.HTTP_400_BAD_REQUEST)
        validated_tags_to_remove = [a.lower().strip() for a in tags_to_remove]
        try:
            StickerTagEntry.objects.filter(
                user=usr, sticker__in=stickers, tag__in=validated_tags_to_remove).delete()
        except Exception as e:
            return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MassTagReplaceView(APIView):
    '''
    a view to mass replace multiple tags from multiple stickers.
    '''

    def patch(self, request, user):
        usr = get_object_or_404(UserEntry, user=user)
        tags_to_remove = request.data.get('tags_to_remove', None)
        tags_to_add = request.data.get('tags_to_add', None)
        # sticker may need to be an object that has sticker, file_id, and set_name in it
        stickers = request.data.get('stickers', None)
        mapped_stickers = []
        for sticker in stickers:
            mapped_stickers.append(sticker.get("sticker"))
        if stickers is None or len(stickers) == 0:
            return Response({"error": "No or empty stickers list provided."}, status=status.HTTP_400_BAD_REQUEST)

        if ((tags_to_remove is not None) and (len(tags_to_remove) > 0)):
            validated_tags_to_remove = [tg.lower().strip()
                                        for tg in tags_to_remove]
            StickerTagEntry.objects.filter(
                user=user, tag__in=validated_tags_to_remove, sticker__in=mapped_stickers).delete()
        if (tags_to_add is None) or (len(tags_to_add) < 1):
            return Response(status=status.HTTP_200_OK)

        for sticker in stickers:
            for tag in tags_to_add:
                try:
                    serializer = StickerTagEntrySerializer(
                        data={"user": usr.user, "sticker": sticker.get("sticker"), "tag": tag, "file_id": sticker.get("file_id"), "set_name": sticker.get("set_name")})
                    if not serializer.is_valid():
                        continue
                    serializer.save()
                except Exception as e:
                    return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(status=status.HTTP_200_OK)
