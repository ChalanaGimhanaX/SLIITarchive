from rest_framework.routers import DefaultRouter

from .views import (
    DocumentReportViewSet,
    ModerationDocumentViewSet,
    ModerationLogViewSet,
)

router = DefaultRouter()
router.register("documents", ModerationDocumentViewSet, basename="moderation-document")
router.register("logs", ModerationLogViewSet, basename="moderation-log")
router.register("reports", DocumentReportViewSet, basename="document-report")

urlpatterns = router.urls
