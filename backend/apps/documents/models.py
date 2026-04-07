from django.conf import settings
from django.db import models

from apps.taxonomy.models import Module


class Document(models.Model):
    class DocumentType(models.TextChoices):
        PAST_PAPER = "past_paper", "Past Paper"
        NOTE = "note", "Note"
        TUTORIAL = "tutorial", "Tutorial"

    class Status(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        PROCESSING = "processing", "Processing"
        PENDING_REVIEW = "pending_review", "Pending Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        FAILED = "failed", "Failed"

    module = models.ForeignKey(Module, on_delete=models.PROTECT, related_name="documents")
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="documents")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="approved_documents",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.UPLOADED, db_index=True)
    file = models.FileField(upload_to="documents/%Y/%m/")
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)
    file_hash = models.CharField(max_length=64, db_index=True, blank=True)
    academic_year_label = models.CharField(max_length=20, blank=True)
    semester_label = models.CharField(max_length=20, blank=True)
    exam_session = models.CharField(max_length=100, blank=True)
    is_public = models.BooleanField(default=False)
    page_count = models.PositiveIntegerField(default=0)
    extracted_text = models.TextField(blank=True)
    search_vector = models.TextField(blank=True, default="")
    processing_error = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self) -> str:
        return self.title
