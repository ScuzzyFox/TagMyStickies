from django.shortcuts import render, get_object_or_404
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
        if (id is not None):
            queryset = queryset.filter(id=id)
        if (sticker is not None):
            queryset = queryset.filter(sticker__contains=sticker)
        if (tag is not None):
            queryset = queryset.filter(tag__icontains=tag)
        if user is not None:
            try:
                user = int(user)  # Convert user ID to integer
                queryset = queryset.filter(user=user)
            except ValueError:
                # Handle the case where the user ID is not a valid integer
                queryset = queryset.none()  # Return an empty queryset
        # filter here
        return queryset


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
