from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.taxonomy.models import DegreeProgram, Faculty, Module


class Command(BaseCommand):
    help = "Seed a small demo taxonomy and demo users for local smoke testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default="demo12345",
            help="Password to use for demo users.",
        )

    def handle(self, *args, **options):
        password = options["password"]
        User = get_user_model()

        faculty, _ = Faculty.objects.update_or_create(
            slug="computing",
            defaults={"name": "Faculty of Computing", "is_active": True},
        )
        degree, _ = DegreeProgram.objects.update_or_create(
            faculty=faculty,
            name="Software Engineering",
            defaults={"slug": "seng", "short_code": "SE", "is_active": True},
        )
        module, _ = Module.objects.update_or_create(
            degree_program=degree,
            code="SE3020",
            defaults={
                "title": "Software Engineering",
                "slug": "se3020-software-engineering",
                "semester": "Semester 1",
                "academic_year": "Year 3",
                "is_active": True,
            },
        )

        student, _ = User.objects.get_or_create(
            email="demo.student@sliit.local",
            defaults={
                "username": "demo_student",
                "full_name": "Demo Student",
                "role": User.Role.STUDENT,
                "is_email_verified": True,
            },
        )
        student.is_active = True
        student.set_password(password)
        student.save(update_fields=["password", "is_active"])

        moderator, _ = User.objects.get_or_create(
            email="demo.moderator@sliit.local",
            defaults={
                "username": "demo_moderator",
                "full_name": "Demo Moderator",
                "role": User.Role.MODERATOR,
                "is_email_verified": True,
            },
        )
        moderator.is_active = True
        moderator.set_password(password)
        moderator.save(update_fields=["password", "is_active"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded demo data: faculty={faculty.slug}, degree={degree.slug}, module={module.code}, "
                "student=demo.student@sliit.local, moderator=demo.moderator@sliit.local"
            )
        )
