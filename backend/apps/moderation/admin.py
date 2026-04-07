from django.contrib import admin

from .models import DocumentReport, ModerationLog


@admin.register(ModerationLog)
class ModerationLogAdmin(admin.ModelAdmin):
    list_display = ("document", "moderator", "action", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("document__title", "moderator__email", "notes")


@admin.register(DocumentReport)
class DocumentReportAdmin(admin.ModelAdmin):
    list_display = ("document", "reported_by", "reason", "status", "created_at")
    list_filter = ("reason", "status", "created_at")
    search_fields = ("document__title", "reported_by__email", "details")
