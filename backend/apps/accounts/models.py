from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.text import slugify


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        MODERATOR = "moderator", "Moderator"
        ADMIN = "admin", "Admin"

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    is_email_verified = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    @property
    def is_moderator(self) -> bool:
        return self.role == self.Role.MODERATOR

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.__class__.objects.normalize_email(self.email).lower()
        if self.username:
            self.username = self.username.strip()
        elif self.email:
            self.username = slugify(self.email.split("@", 1)[0])[:150] or self.email.split("@", 1)[0][:150]
        if not self.is_superuser:
            self.is_staff = self.role in {self.Role.MODERATOR, self.Role.ADMIN}
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.email
