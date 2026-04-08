from __future__ import annotations

import time

from django.conf import settings


class SessionActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if not getattr(request, "user", None) or not request.user.is_authenticated:
            return response

        refresh_seconds = max(0, int(getattr(settings, "SESSION_ACTIVITY_REFRESH_SECONDS", 300)))
        session = request.session
        now = int(time.time())
        last_activity = int(session.get("_last_activity_ts", 0) or 0)

        if last_activity == 0 or now - last_activity >= refresh_seconds:
            session["_last_activity_ts"] = now
            session.set_expiry(settings.SESSION_COOKIE_AGE)

        return response
