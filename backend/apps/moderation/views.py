from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.documents.models import Document
from .models import DocumentReport, ModerationLog
from .serializers import (
    CreateDocumentReportSerializer,
    DocumentReportSerializer,
    ModerationDecisionSerializer,
    ModerationDocumentSerializer,
    ModerationLogSerializer,
    ModerationRejectSerializer,
)
from .services import approve_document, reject_document, reprocess_document


class StaffOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_staff
                or getattr(request.user, "is_moderator", False)
                or getattr(request.user, "is_admin", False)
            )
        )


class ModerationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ModerationLog.objects.select_related("document", "moderator").all()
    serializer_class = ModerationLogSerializer
    permission_classes = [StaffOnly]


class DocumentReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DocumentReport.objects.select_related("document", "reported_by").all()
    serializer_class = DocumentReportSerializer
    permission_classes = [StaffOnly]


class ModerationDocumentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Document.objects.select_related("module", "module__degree_program", "uploader", "approved_by").all()
    serializer_class = ModerationDocumentSerializer
    permission_classes = [StaffOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_value = self.request.query_params.get("status")
        if status_value:
            queryset = queryset.filter(status=status_value)
        else:
            queryset = queryset.filter(
                Q(status=Document.Status.PENDING_REVIEW)
                | Q(status=Document.Status.PROCESSING)
                | Q(status=Document.Status.FAILED)
            )
        return queryset

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        document = self.get_object()
        serializer = ModerationDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        approve_document(document=document, moderator=request.user, notes=serializer.validated_data.get("notes", ""))
        return Response(self.get_serializer(document).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        document = self.get_object()
        serializer = ModerationRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reject_document(
            document=document,
            moderator=request.user,
            reason=serializer.validated_data["reason"],
            notes=serializer.validated_data.get("notes", ""),
        )
        return Response(self.get_serializer(document).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reprocess(self, request, pk=None):
        document = self.get_object()
        serializer = ModerationDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reprocess_document(document=document, moderator=request.user, notes=serializer.validated_data.get("notes", ""))
        return Response(self.get_serializer(document).data, status=status.HTTP_202_ACCEPTED)


class PublicDocumentReportViewSet(viewsets.ModelViewSet):
    queryset = DocumentReport.objects.select_related("document", "reported_by").all()
    serializer_class = CreateDocumentReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["post"]

    def perform_create(self, serializer):
        document = Document.objects.get(
            pk=self.kwargs["document_pk"],
            status=Document.Status.APPROVED,
            is_public=True,
        )
        serializer.save(document=document, reported_by=self.request.user)
