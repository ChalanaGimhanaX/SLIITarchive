from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    list_display = ("email", "username", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    ordering = ("email",)
    search_fields = ("email", "username", "full_name")

    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Profile", {"fields": ("full_name", "role", "is_email_verified")}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        (
            "Profile",
            {
                "fields": ("email", "full_name", "role", "is_email_verified"),
            },
        ),
    )
