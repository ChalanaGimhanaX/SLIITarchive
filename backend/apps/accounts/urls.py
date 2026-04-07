from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminUserViewSet,
    GoogleLoginView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    SessionCsrfView,
    SessionGoogleLoginView,
    SessionLoginView,
    SessionLogoutView,
)

router = DefaultRouter()
router.register("users", AdminUserViewSet, basename="admin-user")

urlpatterns = router.urls + [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("google/login/", GoogleLoginView.as_view(), name="google-login"),
    path("session/csrf/", SessionCsrfView.as_view(), name="session-csrf"),
    path("session/login/", SessionLoginView.as_view(), name="session-login"),
    path("session/google/login/", SessionGoogleLoginView.as_view(), name="session-google-login"),
    path("session/logout/", SessionLogoutView.as_view(), name="session-logout"),
    path("session/me/", MeView.as_view(), name="session-me"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
]
