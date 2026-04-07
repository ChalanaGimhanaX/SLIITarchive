import hashlib

from django.conf import settings
from django.db import models


class AnalyticsEvent(models.Model):
    class EventType(models.TextChoices):
        PAGE_VIEW = "page_view", "Page View"
        DOWNLOAD = "download", "Download"

    event_type = models.CharField(max_length=20, choices=EventType.choices, db_index=True)
    path = models.CharField(max_length=255, blank=True)
    visitor_id = models.CharField(max_length=64, db_index=True)
    session_key = models.CharField(max_length=40, blank=True, db_index=True)
    ip_hash = models.CharField(max_length=64, blank=True, db_index=True)
    user_agent = models.CharField(max_length=512, blank=True)
    referrer = models.CharField(max_length=500, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analytics_events",
    )
    document = models.ForeignKey(
        "documents.Document",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analytics_events",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["event_type", "created_at"]),
            models.Index(fields=["visitor_id", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.event_type} {self.path or self.document_id or 'event'}"

    @staticmethod
    def make_ip_hash(ip_address: str) -> str:
        if not ip_address:
            return ""
        return hashlib.sha256(f"{settings.SECRET_KEY}:{ip_address}".encode("utf-8")).hexdigest()

