from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.db import connections
from django.db.models import Q
from django.db.models import QuerySet

from .models import Document


def approved_documents() -> QuerySet[Document]:
    return Document.objects.select_related("module", "module__degree_program", "uploader").filter(
        status=Document.Status.APPROVED,
        is_public=True,
    )


def search_documents(queryset: QuerySet[Document], query: str | None) -> QuerySet[Document]:
    if not query:
        return queryset

    connection = connections[queryset.db]
    if connection.vendor != "postgresql":
        return (
            queryset.filter(
                Q(title__icontains=query)
                | Q(description__icontains=query)
                | Q(extracted_text__icontains=query)
                | Q(module__code__icontains=query)
                | Q(module__title__icontains=query)
            )
            .order_by("-uploaded_at")
        )

    search_query = SearchQuery(query)
    vector = (
        SearchVector("title", weight="A")
        + SearchVector("module__code", weight="A")
        + SearchVector("module__title", weight="B")
        + SearchVector("description", weight="C")
        + SearchVector("extracted_text", weight="D")
    )

    return (
        queryset.annotate(search_rank=SearchRank(vector, search_query))
        .filter(search_rank__gt=0)
        .order_by("-search_rank", "-uploaded_at")
    )
