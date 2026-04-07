from rest_framework import serializers

from apps.documents.models import Document

from .models import DocumentReport, ModerationLog


class ModerationLogSerializer(serializers.ModelSerializer):
    document = serializers.StringRelatedField()
    moderator = serializers.StringRelatedField()

    class Meta:
        model = ModerationLog
        fields = ("id", "document", "moderator", "action", "notes", "created_at")


class DocumentReportSerializer(serializers.ModelSerializer):
    document = serializers.StringRelatedField()
    reported_by = serializers.StringRelatedField()

    class Meta:
        model = DocumentReport
        fields = ("id", "document", "reported_by", "reason", "details", "status", "created_at")


class CreateDocumentReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentReport
        fields = ("reason", "details")


class ModerationDecisionSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)


class ModerationRejectSerializer(ModerationDecisionSerializer):
    reason = serializers.CharField(required=True, allow_blank=False)


class ModerationDocumentSerializer(serializers.ModelSerializer):
    module = serializers.StringRelatedField()
    uploader = serializers.StringRelatedField()
    approved_by = serializers.StringRelatedField()

    class Meta:
        model = Document
        fields = (
            "id",
            "title",
            "module",
            "uploader",
            "approved_by",
            "document_type",
            "status",
            "file",
            "file_name",
            "file_size",
            "mime_type",
            "page_count",
            "processing_error",
            "rejection_reason",
            "uploaded_at",
            "processed_at",
            "approved_at",
        )
