from django.db import transaction
from django.utils import timezone

from apps.documents.models import Document
from apps.documents.tasks import extract_document_text

from .models import ModerationLog


def approve_document(*, document: Document, moderator, notes: str = "") -> Document:
    document.status = Document.Status.APPROVED
    document.is_public = True
    document.approved_by = moderator
    document.approved_at = timezone.now()
    document.rejection_reason = ""
    document.processing_error = ""
    document.save(
        update_fields=[
            "status",
            "is_public",
            "approved_by",
            "approved_at",
            "rejection_reason",
            "processing_error",
        ]
    )
    ModerationLog.objects.create(
        document=document,
        moderator=moderator,
        action=ModerationLog.Action.APPROVED,
        notes=notes,
    )
    return document


def reject_document(*, document: Document, moderator, reason: str, notes: str = "") -> Document:
    document.status = Document.Status.REJECTED
    document.is_public = False
    document.approved_by = None
    document.approved_at = None
    document.rejection_reason = reason
    document.save(
        update_fields=[
            "status",
            "is_public",
            "approved_by",
            "approved_at",
            "rejection_reason",
        ]
    )
    ModerationLog.objects.create(
        document=document,
        moderator=moderator,
        action=ModerationLog.Action.REJECTED,
        notes=notes or reason,
    )
    return document


def reprocess_document(*, document: Document, moderator, notes: str = "") -> Document:
    document.status = Document.Status.PROCESSING
    document.is_public = False
    document.approved_by = None
    document.approved_at = None
    document.processing_error = ""
    document.rejection_reason = ""
    document.save(
        update_fields=[
            "status",
            "is_public",
            "approved_by",
            "approved_at",
            "processing_error",
            "rejection_reason",
        ]
    )
    ModerationLog.objects.create(
        document=document,
        moderator=moderator,
        action=ModerationLog.Action.REOPENED,
        notes=notes,
    )
    transaction.on_commit(lambda: extract_document_text.delay(document.pk))
    return document
