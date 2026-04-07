from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.moderation.views import PublicDocumentReportViewSet
from .views import DocumentViewSet

router = DefaultRouter()
router.register("", DocumentViewSet, basename="documents")

document_report_create = PublicDocumentReportViewSet.as_view({"post": "create"})

urlpatterns = router.urls + [
    path("<int:document_pk>/reports/", document_report_create, name="document-report-create"),
]
