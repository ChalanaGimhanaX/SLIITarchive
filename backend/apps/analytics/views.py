from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from apps.documents.models import Document

from .models import AnalyticsEvent
from .serializers import AnalyticsEventSerializer


class StaffOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_staff
                or getattr(request.user, "is_moderator", False)
                or getattr(request.user, "is_admin", False)
            )
        )


class AnalyticsEventCreateView(generics.GenericAPIView):
    serializer_class = AnalyticsEventSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.session.session_key:
            request.session.create()

        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
        ip_address = forwarded_for.split(",", 1)[0].strip() if forwarded_for else request.META.get("REMOTE_ADDR", "")

        AnalyticsEvent.objects.create(
            event_type=serializer.validated_data["event_type"],
            path=serializer.validated_data.get("path", "")[:255],
            visitor_id=serializer.validated_data["visitor_id"],
            referrer=serializer.validated_data.get("referrer", "")[:500],
            document=serializer.validated_data.get("document"),
            user=request.user if request.user.is_authenticated else None,
            session_key=request.session.session_key or "",
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:512],
            ip_hash=AnalyticsEvent.make_ip_hash(ip_address),
        )

        return Response(status=status.HTTP_201_CREATED)


class AnalyticsSummaryView(generics.GenericAPIView):
    permission_classes = [StaffOnly]

    def get(self, request, *args, **kwargs):
        seven_days_ago = timezone.now() - timedelta(days=7)
        event_qs = AnalyticsEvent.objects.all()
        User = get_user_model()

        top_downloads = (
            Document.objects.filter(analytics_events__event_type=AnalyticsEvent.EventType.DOWNLOAD)
            .annotate(download_count=Count("analytics_events"))
            .order_by("-download_count", "-uploaded_at")[:5]
        )

        return Response(
            {
                "total_visitors": event_qs.values("visitor_id").distinct().count(),
                "visitors_last_7_days": event_qs.filter(created_at__gte=seven_days_ago).values("visitor_id").distinct().count(),
                "total_page_views": event_qs.filter(event_type=AnalyticsEvent.EventType.PAGE_VIEW).count(),
                "page_views_last_7_days": event_qs.filter(
                    event_type=AnalyticsEvent.EventType.PAGE_VIEW,
                    created_at__gte=seven_days_ago,
                ).count(),
                "total_downloads": event_qs.filter(event_type=AnalyticsEvent.EventType.DOWNLOAD).count(),
                "downloads_last_7_days": event_qs.filter(
                    event_type=AnalyticsEvent.EventType.DOWNLOAD,
                    created_at__gte=seven_days_ago,
                ).count(),
                "total_users": User.objects.count(),
                "user_roles": {
                    "students": User.objects.filter(role="student").count(),
                    "moderators": User.objects.filter(role="moderator").count(),
                    "admins": User.objects.filter(role="admin").count(),
                },
                "top_downloads": [
                    {
                        "id": document.id,
                        "title": document.title,
                        "module": str(document.module),
                        "downloads": document.download_count,
                    }
                    for document in top_downloads
                ],
                "top_pages": list(
                    event_qs.filter(event_type=AnalyticsEvent.EventType.PAGE_VIEW)
                    .exclude(path="")
                    .values("path")
                    .annotate(visits=Count("id"))
                    .order_by("-visits", "path")[:5]
                ),
            },
            status=status.HTTP_200_OK,
        )

