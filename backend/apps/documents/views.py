from django.db import transaction
from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Document
from .selectors import approved_documents, search_documents
from .serializers import DocumentSerializer
from .tasks import extract_document_text


class DocumentPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if view.action in {"create", "mine"}:
            return bool(request.user and request.user.is_authenticated)
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            if obj.status == Document.Status.APPROVED and obj.is_public:
                return True
            return bool(
                request.user
                and request.user.is_authenticated
                and (
                    request.user.is_staff
                    or getattr(request.user, "is_moderator", False)
                    or getattr(request.user, "is_admin", False)
                    or obj.uploader_id == request.user.id
                )
            )
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_staff
                or getattr(request.user, "is_moderator", False)
                or getattr(request.user, "is_admin", False)
                or obj.uploader_id == request.user.id
            )
        )


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [DocumentPermission]

    def get_queryset(self):
        queryset = Document.objects.select_related("module", "module__degree_program", "uploader").all()
        user = self.request.user
        if self.action == "mine":
            queryset = queryset.filter(uploader=user)
        elif user.is_authenticated and (
            user.is_staff or getattr(user, "is_moderator", False) or getattr(user, "is_admin", False)
        ):
            queryset = queryset
        elif self.action == "retrieve" and user.is_authenticated:
            queryset = queryset.filter(Q(status=Document.Status.APPROVED, is_public=True) | Q(uploader=user))
        else:
            queryset = approved_documents()

        queryset = self.apply_filters(queryset.distinct())
        return search_documents(queryset, self.request.query_params.get("q"))

    def apply_filters(self, queryset):
        params = self.request.query_params
        module_id = params.get("module")
        degree_program_id = params.get("degree_program")
        faculty_id = params.get("faculty")
        document_type = params.get("document_type")
        academic_year_label = params.get("academic_year_label")
        semester_label = params.get("semester_label")
        exam_session = params.get("exam_session")
        status_value = params.get("status")

        if module_id:
            queryset = queryset.filter(module_id=module_id)
        if degree_program_id:
            queryset = queryset.filter(module__degree_program_id=degree_program_id)
        if faculty_id:
            queryset = queryset.filter(module__degree_program__faculty_id=faculty_id)
        if document_type:
            queryset = queryset.filter(document_type=document_type)
        if academic_year_label:
            queryset = queryset.filter(academic_year_label=academic_year_label)
        if semester_label:
            queryset = queryset.filter(semester_label=semester_label)
        if exam_session:
            queryset = queryset.filter(exam_session__iexact=exam_session)
        if status_value and self.request.user.is_authenticated and (
            self.request.user.is_staff
            or getattr(self.request.user, "is_moderator", False)
            or getattr(self.request.user, "is_admin", False)
        ):
            queryset = queryset.filter(status=status_value)

        return queryset

    def perform_create(self, serializer):
        document = serializer.save(uploader=self.request.user, status=Document.Status.PROCESSING, is_public=False)
        transaction.on_commit(lambda: extract_document_text.delay(document.pk))

    def perform_destroy(self, instance):
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
