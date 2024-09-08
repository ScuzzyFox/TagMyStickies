from django.urls import path
from records import views


'''
These url definitions are what expose your views to a client.
'''

urlpatterns = [
    path('records/user-entries/', views.UserEntryList.as_view(),
         name="user-entries-list"),
    path('records/user-entries/<int:pk>/',
         views.UserEntryDetail.as_view(), name="user-entry-detail"),
    path('records/ste/', views.StickerTagEntryList.as_view(),
         name="sticker-tag-entries-list"),
    path('records/ste/<int:pk>/', views.StickerTagEntryDetail.as_view(),
         name="sticker-tag-entry-detail"),
    path('records/filter-stickers/',
         views.FilterStickersView.as_view(), name="filter-stickers"),
    path('records/user-sticker-tag-list/<int:user>/',
         views.UserStickerTagList.as_view(), name="user-sticker-tag-list"),
    path('records/stickers/<int:user>/<str:sticker>/',
         views.ManipulateMultiStickerView.as_view(), name="manipulate-multi-sticker"),
    path('records/stickers/<int:user>/',
         views.MultiStickerView.as_view(), name="sticker-multi"),
    path('records/stickers/tags/<int:user>/<str:sticker>/',
         views.DeleteTagSetView.as_view(), name="delete-tag-set"),
    path('records/stickers/tags/multi/<int:user>/',
         views.DeleteMultiTagSetView.as_view(), name="delete-multi-tag-set"),
    path('records/stickers/tags/mass-replace/<int:user>/',
         views.MassTagReplaceView.as_view(), name="mass-tag-replace")
]
