from celery import shared_task
from django.utils import timezone

from .models import Document
from .services import extract_pdf_text


@shared_task
def extract_document_text(document_id: int) -> None:
    document = Document.objects.select_related("module").get(pk=document_id)

    if document.status != Document.Status.PROCESSING:
        document.status = Document.Status.PROCESSING
        document.save(update_fields=["status"])

    try:
        document.file.open("rb")
        extracted_text, page_count = extract_pdf_text(document.file)
    except Exception as exc:
        document.status = Document.Status.FAILED
        document.processing_error = str(exc)
        document.save(update_fields=["status", "processing_error"])
        raise
    finally:
        try:
            document.file.close()
        except Exception:
            pass

    document.extracted_text = extracted_text
    document.page_count = page_count
    document.processing_error = ""
    document.processed_at = timezone.now()
    document.status = Document.Status.PENDING_REVIEW
    document.search_vector = "\n".join(
        value for value in [document.title, document.description, extracted_text] if value
    )
    document.save(
        update_fields=[
            "extracted_text",
            "page_count",
            "processing_error",
            "processed_at",
            "status",
            "search_vector",
        ]
    )
