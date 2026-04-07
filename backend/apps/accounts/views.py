from django.conf import settings
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.middleware.csrf import get_token
from django.utils.text import slugify
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from google.auth.exceptions import GoogleAuthError

from .models import User
from .serializers import (
    AdminUserSerializer,
    GoogleLoginSerializer,
    LoginSerializer,
    RegisterSerializer,
    SessionLoginSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]


@method_decorator(ensure_csrf_cookie, name="dispatch")
class SessionCsrfView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        return Response({"csrfToken": get_token(request)}, status=status.HTTP_200_OK)


class SessionLoginView(generics.GenericAPIView):
    serializer_class = SessionLoginSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if not user:
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)

        auth_login(request, user)
        request.session.cycle_key()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


def _generate_unique_username(email: str) -> str:
    base = slugify(email.split("@", 1)[0])[:140] or email.split("@", 1)[0][:140]
    candidate = base
    counter = 1
    while User.objects.filter(username=candidate).exists():
        suffix = f"-{counter}"
        candidate = f"{base[: max(1, 150 - len(suffix))]}{suffix}"
        counter += 1
    return candidate


class GoogleLoginView(generics.GenericAPIView):
    serializer_class = GoogleLoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            return Response({"detail": "Google OAuth is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payload = google_id_token.verify_oauth2_token(
                serializer.validated_data["id_token"],
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except (GoogleAuthError, ValueError):
            return Response({"detail": "Invalid Google token."}, status=status.HTTP_400_BAD_REQUEST)

        email = str(payload.get("email", "")).strip().lower()
        if not email:
            return Response({"detail": "Google account email is missing."}, status=status.HTTP_400_BAD_REQUEST)

        full_name = str(payload.get("name", "")).strip()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": _generate_unique_username(email),
                "full_name": full_name,
                "is_email_verified": True,
            },
        )

        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])
        elif full_name and not user.full_name:
            user.full_name = full_name
            user.save(update_fields=["full_name"])

        refresh = RefreshToken.for_user(user)
        return Response({"refresh": str(refresh), "access": str(refresh.access_token)}, status=status.HTTP_200_OK)


class SessionGoogleLoginView(generics.GenericAPIView):
    serializer_class = GoogleLoginSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            return Response({"detail": "Google OAuth is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payload = google_id_token.verify_oauth2_token(
                serializer.validated_data["id_token"],
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except (GoogleAuthError, ValueError):
            return Response({"detail": "Invalid Google token."}, status=status.HTTP_400_BAD_REQUEST)

        email = str(payload.get("email", "")).strip().lower()
        if not email:
            return Response({"detail": "Google account email is missing."}, status=status.HTTP_400_BAD_REQUEST)

        full_name = str(payload.get("name", "")).strip()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": _generate_unique_username(email),
                "full_name": full_name,
                "is_email_verified": True,
            },
        )

        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])
        elif full_name and not user.full_name:
            user.full_name = full_name
            user.save(update_fields=["full_name"])

        auth_login(request, user)
        request.session.cycle_key()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SessionLogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        auth_logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminOnlyPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or getattr(request.user, "is_admin", False))
        )


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [AdminOnlyPermission]
    http_method_names = ["get", "patch", "head", "options"]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["email", "full_name", "username"]
    ordering_fields = ["date_joined", "last_login", "email", "role"]
