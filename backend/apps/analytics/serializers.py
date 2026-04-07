from rest_framework import serializers

from apps.documents.models import Document


class AnalyticsEventSerializer(serializers.Serializer):
    event_type = serializers.ChoiceField(choices=["page_view", "download"])
    path = serializers.CharField(required=False, allow_blank=True, max_length=255)
    visitor_id = serializers.CharField(required=True, allow_blank=False, max_length=64)
    referrer = serializers.CharField(required=False, allow_blank=True, max_length=500)
    document_id = serializers.PrimaryKeyRelatedField(
        source="document",
        queryset=Document.objects.all(),
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        event_type = attrs["event_type"]
        document = attrs.get("document")
        if event_type == "download" and document is None:
            raise serializers.ValidationError({"document_id": "A document is required for download events."})
        return attrs

