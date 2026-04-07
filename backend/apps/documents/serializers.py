from rest_framework import serializers

from apps.taxonomy.models import Module

from .models import Document
from .services import calculate_uploaded_file_hash


class DocumentSerializer(serializers.ModelSerializer):
    module = serializers.StringRelatedField(read_only=True)
    module_id = serializers.PrimaryKeyRelatedField(source="module", queryset=Module.objects.all(), write_only=True)
    uploader = serializers.StringRelatedField(read_only=True)
    approved_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Document
        fields = (
            "id",
            "module_id",
            "module",
            "uploader",
            "approved_by",
            "title",
            "description",
            "document_type",
            "status",
            "file",
            "file_name",
            "file_size",
            "mime_type",
            "academic_year_label",
            "semester_label",
            "exam_session",
            "is_public",
            "page_count",
            "extracted_text",
            "processing_error",
            "rejection_reason",
            "uploaded_at",
            "processed_at",
            "approved_at",
        )
        read_only_fields = (
            "id",
            "status",
            "file_name",
            "file_size",
            "mime_type",
            "is_public",
            "page_count",
            "extracted_text",
            "processing_error",
            "rejection_reason",
            "uploaded_at",
            "processed_at",
            "approved_at",
        )

    def validate_file(self, value):
        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Only PDF uploads are supported.")
        if value.size > 25 * 1024 * 1024:
            raise serializers.ValidationError("PDF must be 25 MB or smaller.")
        return value

    def create(self, validated_data):
        uploaded_file = validated_data["file"]
        validated_data["file_name"] = uploaded_file.name
        validated_data["file_size"] = uploaded_file.size
        validated_data["mime_type"] = getattr(uploaded_file, "content_type", "application/pdf")
        validated_data["file_hash"] = calculate_uploaded_file_hash(uploaded_file)
        return super().create(validated_data)
