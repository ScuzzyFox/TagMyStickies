from django.urls import path
from records import views

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
         views.UserStickerTagList.as_view(), name="user-sticker-tag-list")
]
