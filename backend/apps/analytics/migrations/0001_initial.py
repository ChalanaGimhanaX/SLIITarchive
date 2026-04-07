from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("documents", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AnalyticsEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("event_type", models.CharField(choices=[("page_view", "Page View"), ("download", "Download")], db_index=True, max_length=20)),
                ("path", models.CharField(blank=True, max_length=255)),
                ("visitor_id", models.CharField(db_index=True, max_length=64)),
                ("session_key", models.CharField(blank=True, db_index=True, max_length=40)),
                ("ip_hash", models.CharField(blank=True, db_index=True, max_length=64)),
                ("user_agent", models.CharField(blank=True, max_length=512)),
                ("referrer", models.CharField(blank=True, max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("document", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="analytics_events", to="documents.document")),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="analytics_events", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="analyticsevent",
            index=models.Index(fields=["event_type", "created_at"], name="apps_analyt_event_t_cc5f8d_idx"),
        ),
        migrations.AddIndex(
            model_name="analyticsevent",
            index=models.Index(fields=["visitor_id", "created_at"], name="apps_analyt_visitor_935d66_idx"),
        ),
    ]
