from django.urls import path

from .views import AnalyticsEventCreateView, AnalyticsSummaryView

urlpatterns = [
    path("events/", AnalyticsEventCreateView.as_view(), name="analytics-event-create"),
    path("summary/", AnalyticsSummaryView.as_view(), name="analytics-summary"),
]

