from django.urls import include, path

urlpatterns = [
    path("auth/", include("apps.accounts.urls")),
    path("analytics/", include("apps.analytics.urls")),
    path("taxonomy/", include("apps.taxonomy.urls")),
    path("documents/", include("apps.documents.urls")),
    path("moderation/", include("apps.moderation.urls")),
]
