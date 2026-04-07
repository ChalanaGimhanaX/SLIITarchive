from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("taxonomy", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Document",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                (
                    "document_type",
                    models.CharField(
                        choices=[("past_paper", "Past Paper"), ("note", "Note"), ("tutorial", "Tutorial")],
                        max_length=20,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("uploaded", "Uploaded"),
                            ("processing", "Processing"),
                            ("pending_review", "Pending Review"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                            ("failed", "Failed"),
                        ],
                        db_index=True,
                        default="uploaded",
                        max_length=30,
                    ),
                ),
                ("file", models.FileField(upload_to="documents/%Y/%m/")),
                ("file_name", models.CharField(blank=True, max_length=255)),
                ("file_size", models.PositiveIntegerField(default=0)),
                ("mime_type", models.CharField(blank=True, max_length=100)),
                ("file_hash", models.CharField(blank=True, db_index=True, max_length=64)),
                ("academic_year_label", models.CharField(blank=True, max_length=20)),
                ("semester_label", models.CharField(blank=True, max_length=20)),
                ("exam_session", models.CharField(blank=True, max_length=100)),
                ("is_public", models.BooleanField(default=False)),
                ("page_count", models.PositiveIntegerField(default=0)),
                ("extracted_text", models.TextField(blank=True)),
                ("search_vector", models.TextField(blank=True, default="")),
                ("processing_error", models.TextField(blank=True)),
                ("rejection_reason", models.TextField(blank=True)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                ("processed_at", models.DateTimeField(blank=True, null=True)),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "approved_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="approved_documents",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "module",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="documents",
                        to="taxonomy.module",
                    ),
                ),
                (
                    "uploader",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="documents",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-uploaded_at"],
            },
        ),
    ]
