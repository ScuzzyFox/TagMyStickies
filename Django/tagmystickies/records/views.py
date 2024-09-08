from django.shortcuts import render, get_object_or_404
from django.core.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import StickerSerializer, StickerTagEntrySerializer, TagSerializer, UserEntrySerializer, UserStickerTagSerializer, StickerFilterSerializer
from .models import StickerTagEntry, UserEntry
from rest_framework import generics, mixins, status, request


# lists all user entries or creates a new one
class UserEntryList(generics.ListCreateAPIView):

    serializer_class = UserEntrySerializer

    def get_queryset(self):
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


# manipulates or displays a single user entry
class UserEntryDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = UserEntry.objects.all()
    serializer_class = UserEntrySerializer


# lists all the sticker tag entries or creates a new one
class StickerTagEntryList(generics.ListCreateAPIView):
    serializer_class = StickerTagEntrySerializer

    def get_queryset(self):
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
        # Use try/except to catch ValidationError and return proper response
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# manipulates a specific Sticker tag entry
class StickerTagEntryDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = StickerTagEntry.objects.all()
    serializer_class = StickerTagEntrySerializer


# returns a list of stickers belonging to a user + filtered on the tags supplied
class FilterStickersView(APIView):
    def post(self, request):
        # First, validate the input using StickerFilterSerializer
        serializer = StickerFilterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']
            tags = serializer.validated_data.get('tags', [])

            # If no tags are provided, return all stickers for the user
            if tags:
                stickers = StickerTagEntry.objects.filter(
                    user=user, tag__in=tags).distinct()
            else:
                stickers = StickerTagEntry.objects.filter(user=user).distinct()

            # Serialize the filtered stickers
            result_serializer = StickerTagEntrySerializer(stickers, many=True)
            return Response(result_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# view a user's complete list of stickers and tags
class UserStickerTagList(generics.RetrieveAPIView):
    serializer_class = UserStickerTagSerializer
    queryset = UserEntry.objects.all().prefetch_related('stickers__tags')


class ManipulateMultiStickerView(APIView):

    # add a set of tags to 1 sticker
    def post(self, request, user, sticker):
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

    # delete 1 sticker from user

    def delete(self, request, user, sticker):
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


# do stuff with multiple stickers for a user
class MultiStickerView(APIView):

    # tag multliple stickers with multiple tags all at once
    def post(self, request, user):
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

    # delete a list of stickers!

    def delete(self, request, user):
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


# view to delete a set of tags from a sticker
class DeleteTagSetView(APIView):
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


# view to delete a set of tags from multiple stickers at once
class DeleteMultiTagSetView(APIView):
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


# a view to mass replace multiple tags from multiple stickers.
# todo: test view
class MassTagReplaceView(APIView):
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
