from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailOrUsernameBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        user_model = get_user_model()
        identifier = kwargs.get(user_model.USERNAME_FIELD) or username

        if not identifier or not password:
            return None

        lookup = {"email__iexact": identifier} if "@" in identifier else {"username__iexact": identifier}

        try:
            user = user_model.objects.get(**lookup)
        except user_model.DoesNotExist:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
