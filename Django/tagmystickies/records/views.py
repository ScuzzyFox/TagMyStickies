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
        queryset = StickerTagEntry.objects.all()
        if id is not None:
            queryset = queryset.filter(id=id)
        if sticker is not None:
            queryset = queryset.filter(sticker__contains=sticker)
        if tag is not None:
            queryset = queryset.filter(tag__icontains=tag)
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
        # Validate the input using StickerFilterSerializer
        serializer = StickerFilterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']
            tags = serializer.validated_data.get('tags', [])

            # If no tags are provided, return all unique stickers for the user
            if tags:
                stickers = StickerTagEntry.objects.filter(
                    user=user, tag__in=tags).values_list('sticker', flat=True).distinct()
            else:
                stickers = StickerTagEntry.objects.filter(
                    user=user).values_list('sticker', flat=True).distinct()

            # Return the stickers as a list under the 'stickers' key
            return Response({"stickers": list(stickers)}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        tags_to_add = request.data.get('tags_to_add', None)
        if (tags_to_add is not None and len(tags_to_add) > 0):
            for tag in tags_to_add:
                try:
                    serializer = StickerTagEntrySerializer(
                        data={"user": user, "sticker": sticker, "tag": tag})
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
        if (tags_to_remove is not None):
            validated_tags_to_remove = [tg.lower().strip()
                                        for tg in tags_to_remove]
            StickerTagEntry.objects.filter(
                user=user, tag__in=validated_tags_to_remove, sticker=sticker).delete()
        if (tags_to_add is not None):
            for tag in tags_to_add:
                try:
                    serializer = StickerTagEntrySerializer(
                        data={"user": user, "sticker": sticker, "tag": tag})
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
        stickers = request.data.get('stickers', None)
        tags = request.data.get('tags', None)
        if (stickers is None) and (len(stickers) > 0):
            return Response({"error": "Sticker list not supplied or is empty."}, status=status.HTTP_400_BAD_REQUEST)
        if (tags is None) and (len(tags) > 0):
            return Response({"error": "Tags list not supplied or is empty."}, status=status.HTTP_400_BAD_REQUEST)
        for sticker in stickers:
            for tag in tags:
                serializer = StickerTagEntrySerializer(
                    data={"user": userEntry.user, "sticker": sticker, "tag": tag})
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
        # Ensure the 'stickers' list is provided
        stickers = request.data.get('stickers', None)
        if stickers is None:
            return Response({"error": "Sticker list not supplied."}, status=status.HTTP_400_BAD_REQUEST)

        # Filter for the user's stickers and then filter by the sticker list
        queryset = StickerTagEntry.objects.filter(
            user=user, sticker__in=stickers)

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
        stickers = request.data.get('stickers', None)
        if stickers is None:
            return Response({"error": "No or empty stickers list provided."}, status=status.HTTP_400_BAD_REQUEST)

        if ((tags_to_remove is not None) and (len(tags_to_remove) > 0)):
            validated_tags_to_remove = [tg.lower().strip()
                                        for tg in tags_to_remove]
            StickerTagEntry.objects.filter(
                user=user, tag__in=validated_tags_to_remove, sticker__in=stickers).delete()
        if (tags_to_add is None) or (len(tags_to_add) < 1):
            return Response(status=status.HTTP_200_OK)

        for sticker in stickers:
            for tag in tags_to_add:
                try:
                    serializer = StickerTagEntrySerializer(
                        data={"user": usr.user, "sticker": sticker, "tag": tag})
                    if not serializer.is_valid():
                        continue
                    serializer.save()
                except Exception as e:
                    return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(status=status.HTTP_200_OK)
