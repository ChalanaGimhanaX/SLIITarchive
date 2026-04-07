from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Faculty",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, unique=True)),
                ("slug", models.SlugField(max_length=255, unique=True)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="DegreeProgram",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("slug", models.SlugField(max_length=255)),
                ("short_code", models.CharField(db_index=True, max_length=50)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "faculty",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="degree_programs",
                        to="taxonomy.faculty",
                    ),
                ),
            ],
            options={
                "ordering": ["name"],
                "constraints": [
                    models.UniqueConstraint(fields=("faculty", "name"), name="unique_degree_per_faculty_name"),
                    models.UniqueConstraint(fields=("faculty", "slug"), name="unique_degree_per_faculty_slug"),
                ],
            },
        ),
        migrations.CreateModel(
            name="Module",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(db_index=True, max_length=50)),
                ("title", models.CharField(max_length=255)),
                ("slug", models.SlugField(max_length=255)),
                ("semester", models.CharField(blank=True, max_length=50)),
                ("academic_year", models.CharField(blank=True, max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "degree_program",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="modules",
                        to="taxonomy.degreeprogram",
                    ),
                ),
            ],
            options={
                "ordering": ["code"],
                "constraints": [
                    models.UniqueConstraint(fields=("degree_program", "code"), name="unique_module_per_program_code"),
                    models.UniqueConstraint(fields=("degree_program", "slug"), name="unique_module_per_program_slug"),
                ],
            },
        ),
    ]
