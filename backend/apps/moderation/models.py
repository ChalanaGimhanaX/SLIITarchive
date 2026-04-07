from django.conf import settings
from django.db import models

from apps.documents.models import Document


class ModerationLog(models.Model):
    class Action(models.TextChoices):
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        REOPENED = "reopened", "Reopened"

    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="moderation_logs")
    moderator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="moderation_actions")
    action = models.CharField(max_length=20, choices=Action.choices)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class DocumentReport(models.Model):
    class Reason(models.TextChoices):
        WRONG_MODULE = "wrong_module", "Wrong Module"
        BAD_SCAN = "bad_scan", "Bad Scan"
        COPYRIGHT = "copyright_issue", "Copyright Issue"
        DUPLICATE = "duplicate", "Duplicate"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWED = "reviewed", "Reviewed"
        DISMISSED = "dismissed", "Dismissed"

    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="reports")
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="document_reports")
    reason = models.CharField(max_length=50, choices=Reason.choices)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
