from django.contrib import admin

from apps.moderation.services import approve_document, reject_document, reprocess_document

from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "module", "document_type", "status", "uploader", "uploaded_at")
    list_filter = ("status", "document_type", "module")
    search_fields = ("title", "module__code", "module__title", "file_hash", "uploader__email")
    readonly_fields = (
        "uploaded_at",
        "updated_at",
        "processed_at",
        "approved_at",
        "search_vector",
        "file_hash",
        "page_count",
        "processing_error",
        "extracted_text_preview",
    )
    actions = ("approve_selected", "reject_selected", "reprocess_selected")

    @admin.display(description="Extracted text preview")
    def extracted_text_preview(self, obj):
        if not obj.extracted_text:
            return "No extracted text yet."
        return obj.extracted_text[:500]

    @admin.action(description="Approve selected documents")
    def approve_selected(self, request, queryset):
        count = 0
        for document in queryset:
            approve_document(document=document, moderator=request.user, notes="Approved from Django Admin bulk action.")
            count += 1
        self.message_user(request, f"Approved {count} document(s).")

    @admin.action(description="Reject selected documents")
    def reject_selected(self, request, queryset):
        count = 0
        for document in queryset:
            reject_document(
                document=document,
                moderator=request.user,
                reason="Rejected by moderator from Django Admin.",
                notes="Rejected from Django Admin bulk action.",
            )
            count += 1
        self.message_user(request, f"Rejected {count} document(s).")

    @admin.action(description="Reprocess selected documents")
    def reprocess_selected(self, request, queryset):
        count = 0
        for document in queryset:
            reprocess_document(
                document=document,
                moderator=request.user,
                notes="Reprocessing requested from Django Admin bulk action.",
            )
            count += 1
        self.message_user(request, f"Queued {count} document(s) for reprocessing.")
